import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
// ActionMenu não é usado diretamente aqui, mas os botões de ação são renderizados
// import ActionMenu from '../components/ActionMenu';
import RelatorioTab from '../components/RelatorioTab';

function ComprasView() {
    const [activeView, setActiveView] = useState('lista'); // 'lista' ou 'relatorio'
    const [compras, setCompras] = useState([]);
    const [produtos, setProdutos] = useState([]);
    const [fornecedores, setFornecedores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAddModalVisible, setAddModalVisible] = useState(false);
    const [activeStatusTab, setActiveStatusTab] = useState('Processando');
    const [isNewProduct, setIsNewProduct] = useState(false);

    // --- State para erros do formulário ---
    const [formMessage, setFormMessage] = useState({ text: '', type: '' });
    const [fieldErrors, setFieldErrors] = useState({});

     // Limpa estado do formulário
     const clearFormState = () => {
         setFormMessage({ text: '', type: '' });
         setFieldErrors({});
         setIsNewProduct(false); // Resetar checkbox tbm
     };

    const fetchComprasData = useCallback(async () => {
        setLoading(true);
        try {
            const [comprasRes, produtosRes, fornecedoresRes] = await Promise.all([
                api.get('/compras'),
                api.get('/produtos'),
                api.get('/fornecedores')
            ]);
            setCompras(comprasRes.data);
            setProdutos(produtosRes.data);
            setFornecedores(fornecedoresRes.data);
        } catch (err) {
            console.error("Erro ao carregar dados de compras:", err);
             // Você pode setar uma mensagem geral de erro para a view aqui se desejar
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeView === 'lista') {
            fetchComprasData();
        }
    }, [activeView, fetchComprasData]);

    const handleAddCompra = async (e) => {
        e.preventDefault();
        clearFormState(); // Limpar erros anteriores
        const formData = new FormData(e.target);
        const compraData = Object.fromEntries(formData.entries());
        compraData.isNewProduct = isNewProduct.toString();

        // --- Validação Frontend ---
        let errors = {};
        if (!compraData.fornecedor) errors.fornecedor = "Fornecedor é obrigatório.";
        if (!isNewProduct && !compraData.produto) errors.produto = "Selecione um produto existente.";
        if (isNewProduct) {
            if (!compraData.novoProdutoNome?.trim()) errors.novoProdutoNome = "Nome é obrigatório.";
            if (!compraData.novoProdutoArtista?.trim()) errors.novoProdutoArtista = "Artista é obrigatório.";
            if (!compraData.novoProdutoCategoria?.trim()) errors.novoProdutoCategoria = "Categoria é obrigatória.";
        }
        if (!compraData.quantidade || Number(compraData.quantidade) <= 0) errors.quantidade = "Quantidade inválida.";
        if (!compraData.precoUnitario || Number(compraData.precoUnitario) < 0) errors.precoUnitario = "Preço inválido.";

        setFieldErrors(errors);

        if (Object.keys(errors).length > 0) {
            setFormMessage({ text: 'Preencha todos os campos obrigatórios corretamente.', type: 'error' });
            return;
        }
        // --- Fim Validação ---

        setLoading(true); // Indica loading durante o submit
        try {
            const response = await api.post('/compras', compraData);
            setFormMessage({ text: response.data.msg || 'Compra registrada com sucesso!', type: 'success' });
            setTimeout(() => {
                 setAddModalVisible(false);
                 clearFormState(); // Limpar após fechar
            }, 1500);
            fetchComprasData(); // Atualiza a lista
        } catch (err) {
            const apiErrorMessage = err.response?.data?.msg || 'Erro ao registrar a compra.';
            setFormMessage({ text: apiErrorMessage, type: 'error' });
             // Mapeamento simples de erro API -> campo
            if (apiErrorMessage.includes('Fornecedor')) setFieldErrors(prev => ({...prev, fornecedor: 'Verifique'}));
            if (apiErrorMessage.includes('produto') && !isNewProduct) setFieldErrors(prev => ({...prev, produto: 'Verifique'}));
            if (apiErrorMessage.includes('quantidade')) setFieldErrors(prev => ({...prev, quantidade: 'Inválida'}));
            if (apiErrorMessage.includes('preço')) setFieldErrors(prev => ({...prev, precoUnitario: 'Inválido'}));
             // Erros de novo produto
             if (isNewProduct && apiErrorMessage.includes('Nome')) setFieldErrors(prev => ({...prev, novoProdutoNome: 'Verifique'}));
             if (isNewProduct && apiErrorMessage.includes('artista')) setFieldErrors(prev => ({...prev, novoProdutoArtista: 'Verifique'}));
             if (isNewProduct && apiErrorMessage.includes('categoria')) setFieldErrors(prev => ({...prev, novoProdutoCategoria: 'Verifique'}));

            console.error("Erro ao registrar compra:", err.response || err);
        } finally {
            setLoading(false); // Fim do loading do submit
        }
    };

     // As funções handleGerarNota, handleUpdateStatus, handleApproveAndStock permanecem iguais
     const handleGerarNota = async (compraId) => {
        try {
            const response = await api.get(`/compras/${compraId}/nota`, {
                responseType: 'blob',
            });
            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            window.open(fileURL, '_blank');
        } catch (err) {
            console.error("Erro ao gerar nota fiscal:", err.response || err);
            alert(err.response?.data?.msg || 'Não foi possível gerar a nota fiscal.');
        }
    };

    const handleUpdateStatus = async (compraId, newStatus) => {
         if (!newStatus) return;
         setLoading(true); // Indica loading da ação
         try {
             await api.patch(`/compras/${compraId}/status`, { status: newStatus });
             fetchComprasData(); // Atualiza lista
         } catch (err) {
             console.error("Erro ao atualizar status:", err.response || err);
             alert(err.response?.data?.msg || 'Erro ao atualizar o status da compra.');
         } finally {
             setLoading(false); // Fim do loading da ação
         }
     };

     const handleApproveAndStock = async (compraId) => {
         if (!window.confirm("Confirmar recebimento e adicionar ao estoque? Esta ação mudará o status para 'Finalizada'.")) {
             return;
         }
         setLoading(true); // Indica loading da ação
         try {
             await api.post('/produtos/aprovar-compra', { compraId: compraId });
             fetchComprasData(); // Atualiza lista
         } catch (err) {
             console.error("Erro ao finalizar compra e atualizar estoque:", err.response || err);
             alert(err.response?.data?.msg || 'Erro ao finalizar a compra.');
         } finally {
             setLoading(false); // Fim do loading da ação
         }
     };

     // Função renderActionButtons permanece igual
    const renderActionButtons = (compra) => {
        // Estilo base comum para os botões de status
        const statusButtonStyle = {
            padding: '8px 12px',
            fontSize: '12px',
            color: 'var(--white)', // Texto branco para contraste
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'background-color 0.2s, opacity 0.2s', // Adicionado opacity
            opacity: loading ? 0.6 : 1, // Reduz opacidade se loading geral estiver ativo
        };

        switch (compra.status) {
            case 'Processando':
                return (
                    <button
                        style={{ ...statusButtonStyle, backgroundColor: 'var(--gray-600)' /* Cinza médio */ }}
                        onMouseOver={e => !loading && (e.currentTarget.style.backgroundColor = 'var(--gray-700)')} // Efeito hover
                        onMouseOut={e => !loading && (e.currentTarget.style.backgroundColor = 'var(--gray-600)')} // Restaura cor
                        onClick={() => handleUpdateStatus(compra._id, 'A caminho')}
                        disabled={loading} // Desabilita durante o loading
                    >
                        Marcar "A Caminho"
                    </button>
                );
            case 'A caminho':
                return (
                    <button
                        style={{ ...statusButtonStyle, backgroundColor: 'var(--gray-700)' /* Cinza mais escuro */ }}
                         onMouseOver={e => !loading && (e.currentTarget.style.backgroundColor = 'var(--gray-800)')}
                         onMouseOut={e => !loading && (e.currentTarget.style.backgroundColor = 'var(--gray-700)')}
                        onClick={() => handleUpdateStatus(compra._id, 'Entregue')}
                        disabled={loading}
                    >
                        Marcar "Entregue"
                    </button>
                );
            case 'Entregue':
                return (
                    <button
                        style={{ ...statusButtonStyle, backgroundColor: 'var(--gray-800)' /* Cinza bem escuro */ }}
                         onMouseOver={e => !loading && (e.currentTarget.style.backgroundColor = 'var(--gray-900)')}
                         onMouseOut={e => !loading && (e.currentTarget.style.backgroundColor = 'var(--gray-800)')}
                        onClick={() => handleApproveAndStock(compra._id)}
                        disabled={loading}
                    >
                        Confirmar Recebimento
                    </button>
                );
            case 'Finalizada':
                // Estilo para o texto "Finalizada"
                 return <span style={{ color: 'var(--gray-600)', fontWeight: 'bold', fontSize: '12px', padding: '8px 0' }}>Finalizada</span>;
            case 'Cancelada':
                 return <span style={{ color: 'var(--theme-danger)', fontWeight: 'bold', fontSize: '12px', padding: '8px 0' }}>Cancelada</span>;
            default:
                return null;
        }
    };

    // Componente StatusTabs permanece igual
    const StatusTabs = ({ activeTab, setActiveTab }) => {
        const statuses = ['Processando', 'A caminho', 'Entregue', 'Finalizada', 'Cancelada'];
        return (
            <div className="filter-tabs" style={{ justifyContent: 'center' }}>
                {statuses.map(status => (
                    <a
                        key={status}
                        href="#"
                        className={`filter-tab ${activeTab === status ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); setActiveTab(status); }}
                    >
                        {status}
                    </a>
                ))}
            </div>
        );
    };

    const filteredCompras = compras.filter(c => c.status === activeStatusTab);

    return (
        <div>
            <div className="view-header"><h2>Registro de Compras</h2></div>

            <div className="action-bar" style={{flexDirection: 'column', alignItems: 'stretch', gap: '15px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                    <div className="filter-tabs">
                        <a href="#" className={`filter-tab ${activeView === 'lista' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveView('lista'); }}>Lista de Compras</a>
                        <a href="#" className={`filter-tab ${activeView === 'relatorio' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveView('relatorio'); }}>Relatórios e Gráficos</a>
                    </div>
                    {activeView === 'lista' && (
                        // Usar função que limpa estado
                        <button onClick={() => { setAddModalVisible(true); clearFormState(); }} className="add-button">+ Registrar Nova Compra</button>
                    )}
                </div>

                {activeView === 'lista' && (
                     <div style={{width: '100%', borderTop: '1px solid var(--theme-border)', paddingTop: '15px'}}>
                        <StatusTabs activeTab={activeStatusTab} setActiveTab={setActiveStatusTab} />
                     </div>
                )}
            </div>

            {activeView === 'lista' ? (
                 // Mostrar loading inicial ou ao recarregar
                (loading && compras.length === 0) ? <p style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>A carregar lista de compras...</p> : (
                    <>
                    {loading && <p style={{textAlign: 'center'}}>Atualizando...</p>}
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Nota Fiscal</th>
                                    <th>Produto</th>
                                    <th>Fornecedor</th>
                                    <th>Comprador</th>
                                    <th>Qtd.</th>
                                    <th>Valor Total</th>
                                    <th>Data</th>
                                    <th style={{ textAlign: 'right' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCompras.length > 0 ? filteredCompras.map(compra => (
                                    <tr key={compra._id}>
                                        <td>{compra.numeroNotaFiscal || '-'}</td>
                                        <td>{compra.produto?.nome || 'Produto não encontrado'}</td>
                                        <td>{compra.fornecedor?.nomeFantasia || 'Fornecedor não encontrado'}</td>
                                        <td>{compra.comprador?.name || 'Comprador não encontrado'}</td>
                                        <td>{compra.quantidade}</td>
                                        <td>R$ {compra.precoTotal?.toFixed(2) ?? '0.00'}</td>
                                        <td>{new Date(compra.dataCompra || compra.createdAt).toLocaleDateString('pt-BR')}</td>
                                        <td className="actions" style={{display: 'flex', gap: '5px', justifyContent: 'flex-end', alignItems: 'center'}}>
                                            {renderActionButtons(compra)}
                                            {compra.status !== 'Cancelada' && (
                                                <button className="add-button" style={{padding: '8px 12px', fontSize: '12px', backgroundColor: 'var(--gray-500)'}}
                                                    onMouseOver={e => !loading && (e.currentTarget.style.backgroundColor = 'var(--gray-600)')}
                                                    onMouseOut={e => !loading && (e.currentTarget.style.backgroundColor = 'var(--gray-500)')}
                                                    onClick={() => handleGerarNota(compra._id)}
                                                    disabled={loading} // Desabilitar se houver loading geral
                                                    >
                                                        Gerar Nota
                                                </button>
                                            )}
                                            {/* ActionMenu pode ser adicionado aqui se houver ações como Editar/Excluir compra */}
                                            {/* <ActionMenu onEdit={() => {}} onDelete={() => {}} /> */}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="8" style={{ textAlign: 'center' }}>Nenhuma compra encontrada para o status "{activeStatusTab}".</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    </>
                )
            ) : (
                <RelatorioTab reportType="compras" />
            )}

            {/* Modal Adicionar Compra */}
            <Modal isVisible={isAddModalVisible} onClose={() => { setAddModalVisible(false); clearFormState(); }} title="Registrar Nova Compra">
                 {/* Adicionar a classe 'popup-fornecedor' ou outra se quiser largura maior */}
                 <div className="popup popup-fornecedor">
                    <form onSubmit={handleAddCompra} className="vertical-form">

                        {/* Checkbox Novo Produto */}
                        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="checkbox"
                                id="is-new-product-checkbox"
                                style={{ height: '16px', width: '16px', margin: 0 }}
                                checked={isNewProduct}
                                onChange={(e) => setIsNewProduct(e.target.checked)}
                            />
                            <label htmlFor="is-new-product-checkbox" style={{ fontWeight: 'normal', marginBottom: 0 }}>Cadastrar novo produto durante a compra</label>
                        </div>

                        {/* Campos Novo Produto (Condicional) */}
                        {isNewProduct ? (
                            <div style={{ border: '1px solid #eee', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
                                <h4 style={{marginTop: 0, marginBottom: '10px'}}>Dados do Novo Produto</h4>
                                <div className="input-group">
                                    <label htmlFor="novoProdutoNome" className="required">Nome do Produto</label>
                                    <input id="novoProdutoNome" type="text" name="novoProdutoNome" className={fieldErrors.novoProdutoNome ? 'input-error' : ''} required={isNewProduct} />
                                    {fieldErrors.novoProdutoNome && <span className="error-message-text">{fieldErrors.novoProdutoNome}</span>}
                                </div>
                                <div className="input-group">
                                    <label htmlFor="novoProdutoArtista" className="required">Artista</label>
                                    <input id="novoProdutoArtista" type="text" name="novoProdutoArtista" className={fieldErrors.novoProdutoArtista ? 'input-error' : ''} required={isNewProduct} />
                                     {fieldErrors.novoProdutoArtista && <span className="error-message-text">{fieldErrors.novoProdutoArtista}</span>}
                                </div>
                                <div className="input-group">
                                    <label htmlFor="novoProdutoCategoria" className="required">Categoria</label>
                                    <input id="novoProdutoCategoria" type="text" name="novoProdutoCategoria" className={fieldErrors.novoProdutoCategoria ? 'input-error' : ''} required={isNewProduct} />
                                     {fieldErrors.novoProdutoCategoria && <span className="error-message-text">{fieldErrors.novoProdutoCategoria}</span>}
                                </div>
                            </div>
                        ) : (
                             // Select Produto Existente (Condicional)
                            <div className="input-group">
                                <label htmlFor="produto" className="required">Produto Existente</label>
                                <select id="produto" name="produto" className={fieldErrors.produto ? 'input-error' : ''} required={!isNewProduct}>
                                    <option value="">Selecione um produto</option>
                                    {produtos.map(p => <option key={p._id} value={p._id}>{p.nome} - {p.artista}</option>)}
                                </select>
                                {fieldErrors.produto && <span className="error-message-text">{fieldErrors.produto}</span>}
                            </div>
                        )}

                        <hr style={{margin: '20px 0', border: 'none', borderTop: '1px solid var(--theme-border)'}} />

                        {/* Fornecedor, Quantidade, Preço */}
                        <div className="input-group">
                            <label htmlFor="fornecedor" className="required">Fornecedor</label>
                            <select id="fornecedor" name="fornecedor" className={fieldErrors.fornecedor ? 'input-error' : ''} required>
                                <option value="">Selecione um fornecedor</option>
                                {fornecedores.map(f => <option key={f._id} value={f._id}>{f.nomeFantasia} ({f.cnpj})</option>)}
                            </select>
                            {fieldErrors.fornecedor && <span className="error-message-text">{fieldErrors.fornecedor}</span>}
                        </div>
                        <div className="form-grid">
                             <div className="input-group">
                                 <label htmlFor="quantidade" className="required">Quantidade</label>
                                 <input id="quantidade" type="number" name="quantidade" className={fieldErrors.quantidade ? 'input-error' : ''} required min="1" />
                                 {fieldErrors.quantidade && <span className="error-message-text">{fieldErrors.quantidade}</span>}
                             </div>
                             <div className="input-group">
                                 <label htmlFor="precoUnitario" className="required">Preço Unitário (R$)</label>
                                 <input id="precoUnitario" type="number" name="precoUnitario" className={fieldErrors.precoUnitario ? 'input-error' : ''} required min="0" step="0.01" />
                                 {fieldErrors.precoUnitario && <span className="error-message-text">{fieldErrors.precoUnitario}</span>}
                            </div>
                        </div>

                         {/* Mensagem Geral do Formulário */}
                         {formMessage.text && <p className={`form-message ${formMessage.type}`}>{formMessage.text}</p>}

                        {/* Ações do Popup */}
                        <div className="popup-actions" style={{ marginTop: '20px' }}>
                            <button type="button" onClick={() => { setAddModalVisible(false); clearFormState(); }} className="delete-btn">Cancelar</button>
                            <button type="submit" className="add-button" disabled={loading}>
                                {loading ? 'A Guardar...' : 'Salvar Compra'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
}

export default ComprasView;