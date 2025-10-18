import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import ActionMenu from '../components/ActionMenu';
import RelatorioTab from '../components/RelatorioTab'; // Importa a nova aba

// Estilos inline simples para este componente
const styles = {
     loadingText: { textAlign: 'center', padding: '40px 20px', color: '#6c757d', fontSize: '16px' },
     errorMessage: { color: 'var(--theme-danger)', marginTop: '10px', textAlign: 'center', fontWeight: 'bold' }
};


function VendasView() {
    // State for switching between list and report view
    const [activeTab, setActiveTab] = useState('lista'); // 'lista' ou 'relatorio'

    // States for the sales list view
    const [vendas, setVendas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [viewError, setViewError] = useState(''); // Erro geral da view (ex: falha ao buscar)

    // States for the 'Add New Sale' modal
    const [isAddModalVisible, setAddModalVisible] = useState(false);
    const [clientes, setClientes] = useState([]);
    const [produtos, setProdutos] = useState([]); // Will hold products with stock > 0
    const [selectedClienteId, setSelectedClienteId] = useState('');
    const [cart, setCart] = useState([]);
    const [currentProdutoId, setCurrentProdutoId] = useState('');
    const [pagamentoMetodo, setPagamentoMetodo] = useState('Cartão de Crédito'); // State for payment method

     // State para erros e mensagens do formulário do Modal
     const [formMessage, setFormMessage] = useState({ text: '', type: '' });
     const [fieldErrors, setFieldErrors] = useState({});

    // Limpa estado do formulário do modal
    const clearFormState = () => {
        setFormMessage({ text: '', type: '' });
        setFieldErrors({});
    };


    // Fetch data specifically needed for the sales list and add modal
    const fetchVendasListData = useCallback(async () => {
        setLoading(true);
        setViewError(''); // Limpa erro da view
        try {
            const [vendasRes, clientesRes, produtosRes] = await Promise.all([
                api.get('/vendas'),
                api.get('/clientes'),
                api.get('/produtos') // Buscar todos para ter o estoque atualizado
            ]);
            setVendas(vendasRes.data);
            setClientes(clientesRes.data);
            // Filtra produtos com estoque > 0 APENAS ao popular o dropdown no modal
            setProdutos(produtosRes.data); // Guarda todos os produtos
        } catch (err) {
            console.error("Erro ao buscar dados da lista de vendas:", err);
            setViewError("Falha ao carregar dados da lista de vendas.");
        } finally {
            setLoading(false); // Loading finished
        }
    }, []); // Sem dependências aqui, será chamado manualmente ou pelo useEffect abaixo

    // Effect to fetch data when the 'lista' tab is active
    useEffect(() => {
        if (activeTab === 'lista') {
            fetchVendasListData();
        }
    }, [activeTab, fetchVendasListData]); // Depende de activeTab e da função fetch

    // --- Handlers do Carrinho ---
    const handleAddToCart = () => {
        if (!currentProdutoId) return;
        // Usar a lista completa de produtos para encontrar o item
        const produtoToAdd = produtos.find(p => p._id === currentProdutoId);
        if (!produtoToAdd) return; // Checagem se produto existe

        // Verifica se há estoque
         if (produtoToAdd.quantidade <= 0) {
             alert(`Produto "${produtoToAdd.nome}" sem estoque.`);
             setCurrentProdutoId(''); // Reset dropdown
             return;
         }

        const existingItem = cart.find(item => item.produto._id === currentProdutoId);

        if (existingItem) {
             // Verifica se a quantidade desejada excede o estoque disponível
             if (existingItem.quantidade + 1 <= produtoToAdd.quantidade) {
                 setCart(cart.map(item =>
                    item.produto._id === currentProdutoId
                    ? { ...item, quantidade: item.quantidade + 1 }
                    : item
                 ));
             } else {
                 alert(`Estoque máximo atingido para ${produtoToAdd.nome} (${produtoToAdd.quantidade} unidades).`);
             }
        } else {
             // Adiciona se houver pelo menos 1 no estoque (já verificado no início)
            setCart([...cart, { produto: produtoToAdd, quantidade: 1 }]);
        }
        setCurrentProdutoId(''); // Reset dropdown after adding
    };

    const handleRemoveFromCart = (productId) => {
        setCart(cart.filter(item => item.produto._id !== productId));
    };

    const valorTotal = cart.reduce((total, item) => total + (item.produto.preco * item.quantidade), 0);

    // Reseta o estado do modal
    const resetModal = () => {
        setSelectedClienteId('');
        setCart([]);
        setCurrentProdutoId('');
        setPagamentoMetodo('Cartão de Crédito');
        clearFormState(); // Limpa erros e mensagens do form
        setAddModalVisible(false);
    };

     const openAddModal = () => {
         // Filtra produtos COM estoque ANTES de abrir o modal
         // Isso garante que o dropdown só mostre itens disponíveis
         setProdutosDisponiveis(produtos.filter(p => p.quantidade > 0));
         resetModal(); // Garante que o modal esteja limpo
         setAddModalVisible(true);
     };

     // Estado separado para os produtos mostrados no dropdown do modal
     const [produtosDisponiveis, setProdutosDisponiveis] = useState([]);


    // --- Handler para Criar Venda ---
    const handleCriarVenda = async (e) => {
        e.preventDefault();
        clearFormState(); // Limpa erros anteriores

        const cliente = clientes.find(c => c._id === selectedClienteId);

        let currentFieldErrors = {};

        if (!selectedClienteId) {
            currentFieldErrors.cliente = "Selecione um cliente.";
        } else if (!cliente || !cliente.endereco || !cliente.endereco.cep) {
            // Se o cliente existe mas não tem endereço/cep, marca o campo cliente como erro
             currentFieldErrors.cliente = "Cliente selecionado não possui endereço completo (com CEP).";
        }

        if (cart.length === 0) {
             // Não há um campo específico, usamos mensagem geral
             setFormMessage({ text: "Adicione produtos ao carrinho antes de finalizar a venda.", type: 'error' });
             setFieldErrors(currentFieldErrors); // Atualiza erros de campo se houver
             return;
        }

        const form = e.target;
        let pagamentoDetalhes = {};
        if (pagamentoMetodo === 'Cartão de Crédito') {
            const numeroCartao = form.numeroCartao?.value?.trim();
            const nomeTitular = form.nomeTitular?.value?.trim();
            const validade = form.validade?.value?.trim();
            const cvv = form.cvv?.value?.trim();

            if (!numeroCartao) currentFieldErrors.numeroCartao = "Obrigatório.";
            if (!nomeTitular) currentFieldErrors.nomeTitular = "Obrigatório.";
            if (!validade || !/^\d{2}\/\d{2}$/.test(validade)) currentFieldErrors.validade = "Formato MM/AA.";
            if (!cvv || !/^\d{3,4}$/.test(cvv)) currentFieldErrors.cvv = "Inválido.";

            if (Object.keys(currentFieldErrors).length === 0) { // Só preenche detalhes se não houver erro no cartão
                pagamentoDetalhes = { numeroCartao, nomeTitular, validade, cvv };
            }
        }

        setFieldErrors(currentFieldErrors); // Atualiza os erros de campo

        // Se houver qualquer erro (cliente, carrinho vazio, cartão), interrompe
        if (Object.keys(currentFieldErrors).length > 0 || formMessage.text) {
             if (!formMessage.text) { // Se a msg geral não foi setada (carrinho vazio)
                setFormMessage({ text: 'Por favor, corrija os erros no formulário.', type: 'error' });
             }
            return;
        }


        const vendaData = {
            clienteId: selectedClienteId,
            itens: cart.map(item => ({
                produto: item.produto._id,
                quantidade: item.quantidade,
                precoUnitario: item.produto.preco
            })),
            pagamento: { metodo: pagamentoMetodo, detalhes: pagamentoDetalhes, status: 'Aprovado' }, // Assume aprovado
            enderecoEntrega: cliente.endereco,
            valorTotal,
        };

        setLoading(true); // Indica loading durante a submissão
        try {
            await api.post('/vendas', vendaData);
            setFormMessage({ text: 'Venda registrada com sucesso!', type: 'success' });
            setTimeout(() => {
                resetModal(); // Fecha e limpa o modal
            }, 1500);
            fetchVendasListData(); // Refresh the sales list
        } catch (err) {
            const apiErrorMessage = err.response?.data?.msg || 'Erro ao criar a venda.';
            setFormMessage({ text: apiErrorMessage, type: 'error' });
            // Tentar mapear erro de estoque (exemplo, depende da msg da API)
            if (apiErrorMessage.toLowerCase().includes('estoque insuficiente')) {
                 // Poderia tentar destacar a tabela do carrinho ou mostrar um erro geral
            }
            console.error("Erro API ao criar venda:", err.response || err);
        } finally {
            setLoading(false); // Fim do loading da submissão
        }
    };

    // --- Componente Interno PagamentoForm ---
    const PagamentoForm = () => (
         <div style={{ border: '1px solid var(--theme-border)', borderRadius: '8px', padding: '20px', marginTop: '20px' }}>
            <h4>Pagamento</h4>
             {/* Radio buttons */}
            <div className="input-group" style={{ alignItems: 'center', marginBottom: '10px' }}>
                 <input type="radio" id="pix" name="pagamento" value="PIX" checked={pagamentoMetodo === 'PIX'} onChange={e => setPagamentoMetodo(e.target.value)} style={{width: 'auto', marginRight: '8px'}}/>
                 <label htmlFor="pix" style={{ fontWeight: 'normal', marginBottom: 0 }}>Pix</label>
             </div>
             <div className="input-group" style={{ alignItems: 'center', marginBottom: '10px' }}>
                 <input type="radio" id="gpay" name="pagamento" value="Google Pay" checked={pagamentoMetodo === 'Google Pay'} onChange={e => setPagamentoMetodo(e.target.value)} style={{width: 'auto', marginRight: '8px'}}/>
                 <label htmlFor="gpay" style={{ fontWeight: 'normal', marginBottom: 0 }}>Google Pay</label>
             </div>
             <div className="input-group" style={{ alignItems: 'center', marginBottom: '10px' }}>
                 <input type="radio" id="cc" name="pagamento" value="Cartão de Crédito" checked={pagamentoMetodo === 'Cartão de Crédito'} onChange={e => setPagamentoMetodo(e.target.value)} style={{width: 'auto', marginRight: '8px'}}/>
                 <label htmlFor="cc" style={{ fontWeight: 'normal', marginBottom: 0 }}>Cartão de crédito</label>
             </div>

            {/* Campos do Cartão de Crédito */}
            {pagamentoMetodo === 'Cartão de Crédito' && (
                <div style={{ border: '1px solid var(--theme-border)', borderRadius: '8px', padding: '15px', marginTop: '10px' }}>
                    <div className="input-group">
                        <label htmlFor="numeroCartao" className="required">Número do cartão</label>
                        <input id="numeroCartao" name="numeroCartao" type="text" placeholder="0000 0000 0000 0000" className={fieldErrors.numeroCartao ? 'input-error' : ''} required />
                        {fieldErrors.numeroCartao && <span className="error-message-text">{fieldErrors.numeroCartao}</span>}
                    </div>
                    <div className="input-group">
                        <label htmlFor="nomeTitular" className="required">Nome do titular</label>
                        <input id="nomeTitular" name="nomeTitular" type="text" placeholder="Nome como está no cartão" className={fieldErrors.nomeTitular ? 'input-error' : ''} required/>
                        {fieldErrors.nomeTitular && <span className="error-message-text">{fieldErrors.nomeTitular}</span>}
                    </div>
                    <div style={{display: 'flex', gap: '10px'}}>
                        <div className="input-group" style={{flex: 1}}>
                            <label htmlFor="validade" className="required">Validade</label>
                            <input id="validade" name="validade" type="text" placeholder="MM/AA" className={fieldErrors.validade ? 'input-error' : ''} required/>
                            {fieldErrors.validade && <span className="error-message-text">{fieldErrors.validade}</span>}
                        </div>
                        <div className="input-group" style={{flex: 1}}>
                            <label htmlFor="cvv" className="required">CVV</label>
                            <input id="cvv" name="cvv" type="text" placeholder="***" className={fieldErrors.cvv ? 'input-error' : ''} required />
                            {fieldErrors.cvv && <span className="error-message-text">{fieldErrors.cvv}</span>}
                        </div>
                    </div>
                </div>
            )}
         </div>
    );

    // --- Renderização Principal ---
    return (
        <div>
            <div className="view-header"><h2>Gestão de Vendas</h2></div>

            {/* Barra de Ações com Abas */}
            <div className="action-bar">
                <div className="filter-tabs">
                    <a href="#" className={`filter-tab ${activeTab === 'lista' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('lista'); }}>Lista de Vendas</a>
                    <a href="#" className={`filter-tab ${activeTab === 'relatorio' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('relatorio'); }}>Relatórios e Gráficos</a>
                </div>
                {/* Botão Add Venda */}
                {activeTab === 'lista' && (
                     <button onClick={openAddModal} className="add-button">+ Registrar Nova Venda</button>
                )}
            </div>

            {/* Mensagem de erro da View */}
            {viewError && <p style={styles.errorMessage}>{viewError}</p>}

            {/* Conteúdo Condicional (Lista ou Relatório) */}
            {activeTab === 'lista' ? (
                 // Mostra loading inicial ou ao recarregar
                (loading && vendas.length === 0) ? <p style={styles.loadingText}>Carregando lista de vendas...</p> : (
                    <>
                    {loading && <p style={{textAlign: 'center'}}>Atualizando...</p>}
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr><th>Cliente</th><th>Valor Total</th><th>Itens</th><th>Status</th><th>Data</th><th style={{ textAlign: 'right' }}>Ações</th></tr>
                            </thead>
                            <tbody>
                                 {vendas.length === 0 && !loading ? (
                                     <tr><td colSpan="6" style={{ textAlign: 'center' }}>Nenhuma venda encontrada.</td></tr>
                                 ) : (
                                    vendas.map(venda => (
                                        <tr key={venda._id}>
                                            <td>{venda.cliente?.nome || 'Cliente não encontrado'}</td>
                                            <td>R$ {venda.valorTotal?.toFixed(2) || '0.00'}</td>
                                            <td>{venda.itens?.reduce((acc, item) => acc + item.quantidade, 0) || 0}</td>
                                            <td>{venda.status}</td>
                                            <td>{new Date(venda.createdAt).toLocaleDateString('pt-BR')}</td>
                                            <td className="actions">
                                                {/* ActionMenu para Vendas (se houver ações como Cancelar, Editar detalhes) */}
                                                {/* Adapte as props onEdit/onDelete conforme necessário */}
                                                <ActionMenu
                                                    itemId={venda._id}
                                                    onEdit={() => alert(`Editar venda ${venda._id} - Não implementado.`)}
                                                    onDelete={() => alert(`Cancelar venda ${venda._id} - Não implementado.`)}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                 )}
                            </tbody>
                        </table>
                    </div>
                    </>
                )
            ) : (
                // Aba Relatório
                <RelatorioTab reportType="vendas" />
            )}

            {/* Modal 'Registrar Nova Venda' */}
            <Modal isVisible={isAddModalVisible} onClose={resetModal} title="Registrar Nova Venda">
                 {/* Estilos inline para tamanho do modal */}
                 <div className="popup" style={{minWidth: '70vw', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column'}}>
                    <form onSubmit={handleCriarVenda} className="vertical-form" style={{overflowY: 'auto', paddingRight: '15px'}} noValidate> {/* Faz form scrollable */}
                        <h4>Cliente e Produtos</h4>
                        {/* Seletor de Cliente */}
                        <div className="input-group">
                            <label htmlFor="cliente" className="required">Cliente</label>
                            <select
                                id="cliente"
                                name="cliente"
                                value={selectedClienteId}
                                onChange={(e) => setSelectedClienteId(e.target.value)}
                                className={fieldErrors.cliente ? 'input-error' : ''}
                                required
                            >
                                <option value="">Selecione um cliente</option>
                                {/* Garante que clientes é um array */}
                                {Array.isArray(clientes) && clientes.map(c => <option key={c._id} value={c._id}>{c.nome} ({c.email})</option>)}
                            </select>
                            {fieldErrors.cliente && <span className="error-message-text">{fieldErrors.cliente}</span>}
                        </div>

                        {/* Seletor de Produto e Botão Adicionar */}
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '15px' }}>
                            <div className="input-group" style={{ flex: 1, margin: 0 }}>
                                <label htmlFor="produto-select">Adicionar Produto</label>
                                <select id="produto-select" value={currentProdutoId} onChange={(e) => setCurrentProdutoId(e.target.value)}>
                                    <option value="">Selecione um produto</option>
                                    {/* Mapeia apenas produtos disponíveis (com estoque > 0) */}
                                    {Array.isArray(produtosDisponiveis) && produtosDisponiveis.map(p => <option key={p._id} value={p._id}>{p.nome} - {p.artista} (Estoque: {p.quantidade})</option>)}
                                </select>
                            </div>
                            <button type="button" onClick={handleAddToCart} className="add-button" style={{height: '45px', flexShrink: 0}}>+</button>
                        </div>

                        {/* Tabela do Carrinho */}
                        {cart.length > 0 && (
                            <div className="table-container" style={{marginBottom: '20px'}}>
                                <table>
                                    <thead><tr><th>Produto</th><th>Qtd</th><th>Preço Unit.</th><th>Subtotal</th><th></th></tr></thead>
                                    <tbody>
                                        {cart.map(item => (
                                            <tr key={item.produto._id}>
                                                <td>{item.produto.nome}</td>
                                                <td>{item.quantidade}</td>
                                                <td>R$ {item.produto.preco.toFixed(2)}</td>
                                                <td>R$ {(item.produto.preco * item.quantidade).toFixed(2)}</td>
                                                <td style={{textAlign: 'center'}}>
                                                    <button type="button" onClick={() => handleRemoveFromCart(item.produto._id)} className="delete-btn" style={{padding: '5px 10px', fontSize: '12px'}}>X</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <h4 style={{textAlign: 'right', marginTop: '10px'}}>Total: R$ {valorTotal.toFixed(2)}</h4>
                            </div>
                        )}

                        {/* Formulário de Pagamento */}
                        <PagamentoForm />

                         {/* Mensagem Geral do Formulário */}
                        {formMessage.text && <p className={`form-message ${formMessage.type}`}>{formMessage.text}</p>}

                        {/* Ações do Modal */}
                        <div className="popup-actions" style={{marginTop: '20px'}}>
                            <button type="button" onClick={resetModal} className="delete-btn">Cancelar</button>
                            <button type="submit" className="add-button" disabled={loading}>
                                {loading ? 'A Finalizar...' : 'Finalizar Venda'}
                             </button>
                        </div>
                    </form>
                 </div>
            </Modal>
        </div>
    );
}


export default VendasView;