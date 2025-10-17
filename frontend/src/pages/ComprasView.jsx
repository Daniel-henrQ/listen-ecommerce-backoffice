import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import ActionMenu from '../components/ActionMenu';
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
    const [formError, setFormError] = useState('');

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
        setFormError('');
        const formData = new FormData(e.target);
        const compraData = Object.fromEntries(formData.entries());
        compraData.isNewProduct = isNewProduct.toString();

        if (!compraData.fornecedor || (!isNewProduct && !compraData.produto) || (isNewProduct && (!compraData.novoProdutoNome || !compraData.novoProdutoArtista || !compraData.novoProdutoCategoria)) || !compraData.quantidade || !compraData.precoUnitario) {
            setFormError('Preencha todos os campos obrigatórios.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/compras', compraData);
            alert('Compra registrada com sucesso!');
            setAddModalVisible(false);
            setIsNewProduct(false);
            setFormError('');
            fetchComprasData();
        } catch (err) {
            console.error("Erro ao registrar compra:", err.response || err);
            setFormError(err.response?.data?.msg || 'Erro ao registrar a compra. Verifique os dados.');
            alert(err.response?.data?.msg || 'Erro ao registrar a compra. Verifique os dados.');
        } finally {
            setLoading(false);
        }
    };

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
         setLoading(true);
         try {
             await api.patch(`/compras/${compraId}/status`, { status: newStatus });
             // Removido o alert para uma UI mais limpa, a atualização da tabela indica sucesso
             fetchComprasData();
         } catch (err) {
             console.error("Erro ao atualizar status:", err.response || err);
             alert(err.response?.data?.msg || 'Erro ao atualizar o status da compra.');
         } finally {
             setLoading(false);
         }
     };

     const handleApproveAndStock = async (compraId) => {
         if (!window.confirm("Confirmar recebimento e adicionar ao estoque? Esta ação mudará o status para 'Finalizada'.")) {
             return;
         }
         setLoading(true);
         try {
             await api.post('/produtos/aprovar-compra', { compraId: compraId });
             // Removido o alert
             fetchComprasData();
         } catch (err) {
             console.error("Erro ao finalizar compra e atualizar estoque:", err.response || err);
             alert(err.response?.data?.msg || 'Erro ao finalizar a compra.');
         } finally {
             setLoading(false);
         }
     };

    // ** Função renderActionButtons MODIFICADA **
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
            transition: 'background-color 0.2s',
        };

        switch (compra.status) {
            case 'Processando':
                return (
                    <button
                        style={{ ...statusButtonStyle, backgroundColor: 'var(--gray-600)' /* Cinza médio */ }}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--gray-700)'} // Efeito hover
                        onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--gray-600)'} // Restaura cor
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
                         onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--gray-800)'}
                         onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--gray-700)'}
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
                         onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--gray-900)'}
                         onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--gray-800)'}
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
                        <button onClick={() => { setAddModalVisible(true); setFormError(''); }} className="add-button">+ Registrar Nova Compra</button>
                    )}
                </div>

                {activeView === 'lista' && (
                     <div style={{width: '100%', borderTop: '1px solid var(--theme-border)', paddingTop: '15px'}}>
                        <StatusTabs activeTab={activeStatusTab} setActiveTab={setActiveStatusTab} />
                     </div>
                )}
            </div>

            {activeView === 'lista' ? (
                loading ? <p style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>A carregar lista de compras...</p> : (
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
                                                    onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--gray-600)'}
                                                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--gray-500)'}
                                                    onClick={() => handleGerarNota(compra._id)}>
                                                        Gerar Nota
                                                </button>
                                            )}
                                            {/* <ActionMenu onEdit={() => {}} onDelete={() => {}} /> */}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="8" style={{ textAlign: 'center' }}>Nenhuma compra encontrada para o status "{activeStatusTab}".</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )
            ) : (
                <RelatorioTab reportType="compras" />
            )}

            <Modal isVisible={isAddModalVisible} onClose={() => { setAddModalVisible(false); setIsNewProduct(false); setFormError(''); }} title="Registrar Nova Compra">
                 <div className="popup popup-fornecedor">
                    <form onSubmit={handleAddCompra} className="vertical-form">

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

                        {isNewProduct ? (
                            <div style={{ border: '1px solid #eee', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
                                <h4 style={{marginTop: 0, marginBottom: '10px'}}>Dados do Novo Produto</h4>
                                <div className="input-group"><label>Nome do Produto</label><input type="text" name="novoProdutoNome" required={isNewProduct} /></div>
                                <div className="input-group"><label>Artista</label><input type="text" name="novoProdutoArtista" required={isNewProduct} /></div>
                                <div className="input-group"><label>Categoria</label><input type="text" name="novoProdutoCategoria" required={isNewProduct} /></div>
                            </div>
                        ) : (
                            <div className="input-group">
                                <label>Produto Existente</label>
                                <select name="produto" required={!isNewProduct}>
                                    <option value="">Selecione um produto</option>
                                    {produtos.map(p => <option key={p._id} value={p._id}>{p.nome} - {p.artista}</option>)}
                                </select>
                            </div>
                        )}

                        <hr style={{margin: '20px 0', border: 'none', borderTop: '1px solid var(--theme-border)'}} />

                        <div className="input-group">
                            <label>Fornecedor</label>
                            <select name="fornecedor" required>
                                <option value="">Selecione um fornecedor</option>
                                {fornecedores.map(f => <option key={f._id} value={f._id}>{f.nomeFantasia} ({f.cnpj})</option>)}
                            </select>
                        </div>
                        <div className="form-grid">
                             <div className="input-group"><label>Quantidade</label><input type="number" name="quantidade" required min="1" /></div>
                             <div className="input-group"><label>Preço Unitário (R$)</label><input type="number" name="precoUnitario" required min="0" step="0.01" /></div>
                        </div>

                         {formError && <p style={{ color: 'red', marginTop: '10px', textAlign: 'center', fontWeight: 'bold' }}>{formError}</p>}

                        <div className="popup-actions" style={{ marginTop: '20px' }}>
                            <button type="button" onClick={() => { setAddModalVisible(false); setIsNewProduct(false); setFormError(''); }} className="delete-btn">Cancelar</button>
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