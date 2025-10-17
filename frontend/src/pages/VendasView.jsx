import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import ActionMenu from '../components/ActionMenu';
import RelatorioTab from '../components/RelatorioTab'; // Importa a nova aba

function VendasView() {
    // State for switching between list and report view
    const [activeTab, setActiveTab] = useState('lista'); // 'lista' ou 'relatorio'

    // States for the sales list view
    const [vendas, setVendas] = useState([]);
    const [loading, setLoading] = useState(false); // Start as false, set true during fetch

    // States for the 'Add New Sale' modal
    const [isAddModalVisible, setAddModalVisible] = useState(false);
    const [clientes, setClientes] = useState([]);
    const [produtos, setProdutos] = useState([]); // Will hold products with stock > 0
    const [selectedClienteId, setSelectedClienteId] = useState('');
    const [cart, setCart] = useState([]);
    const [currentProdutoId, setCurrentProdutoId] = useState('');
    const [pagamentoMetodo, setPagamentoMetodo] = useState('Cartão de Crédito'); // State for payment method

    // Fetch data specifically needed for the sales list and add modal
    const fetchVendasListData = useCallback(async () => {
        setLoading(true); // Indicate loading when fetching list data
        try {
            const [vendasRes, clientesRes, produtosRes] = await Promise.all([
                api.get('/vendas'),
                api.get('/clientes'),
                api.get('/produtos')
            ]);
            setVendas(vendasRes.data);
            setClientes(clientesRes.data);
            // Filter products with stock available ONLY when setting state for the modal
            setProdutos(produtosRes.data.filter(p => p.quantidade > 0));
        } catch (err) {
            console.error("Erro ao buscar dados da lista de vendas:", err);
            // Optionally set an error state here
        } finally {
            setLoading(false); // Loading finished
        }
    }, []);

    // Effect to fetch data when the 'lista' tab is active
    useEffect(() => {
        if (activeTab === 'lista') {
            fetchVendasListData();
        }
        // No need to fetch report data here, RelatorioTab handles its own data fetching
    }, [activeTab, fetchVendasListData]);

    // --- Handlers from your provided code ---
    const handleAddToCart = () => {
        if (!currentProdutoId) return;
        const produtoToAdd = produtos.find(p => p._id === currentProdutoId);
         if (!produtoToAdd) return; // Added check if product is found

        const existingItem = cart.find(item => item.produto._id === currentProdutoId);

        if (existingItem) {
             // Check against available stock before increasing quantity
             if (existingItem.quantidade < produtoToAdd.quantidade) {
                 setCart(cart.map(item =>
                    item.produto._id === currentProdutoId
                    ? { ...item, quantidade: item.quantidade + 1 }
                    : item
                 ));
             } else {
                 alert(`Estoque máximo atingido para ${produtoToAdd.nome}`);
             }
        } else {
            // Check stock before adding new item
             if (1 <= produtoToAdd.quantidade) {
                setCart([...cart, { produto: produtoToAdd, quantidade: 1 }]);
             } else {
                 alert(`Produto ${produtoToAdd.nome} sem estoque.`);
             }
        }
        setCurrentProdutoId(''); // Reset dropdown after adding
    };

    const handleRemoveFromCart = (productId) => {
        setCart(cart.filter(item => item.produto._id !== productId));
    };

    const valorTotal = cart.reduce((total, item) => total + (item.produto.preco * item.quantidade), 0);

    const resetModal = () => {
        setSelectedClienteId('');
        setCart([]);
        setCurrentProdutoId('');
        setPagamentoMetodo('Cartão de Crédito'); // Reset payment method state
        setAddModalVisible(false);
    };

    const handleCriarVenda = async (e) => {
        e.preventDefault();

        const cliente = clientes.find(c => c._id === selectedClienteId);
        // Added check for cliente.endereco existence
        if (!cliente || !cliente.endereco || !cliente.endereco.cep) {
            alert("Por favor, selecione um cliente com endereço cadastrado (incluindo CEP).");
            return;
        }
        if (cart.length === 0) {
             alert("Adicione produtos ao carrinho antes de finalizar a venda.");
             return;
        }

        const form = e.target;
        let pagamentoDetalhes = {};
        if (pagamentoMetodo === 'Cartão de Crédito') {
            // Basic validation example (consider adding more robust validation)
            if (!form.numeroCartao.value || !form.nomeTitular.value || !form.validade.value || !form.cvv.value) {
                alert("Preencha todos os dados do cartão de crédito.");
                return;
            }
            pagamentoDetalhes = {
                numeroCartao: form.numeroCartao.value,
                nomeTitular: form.nomeTitular.value,
                validade: form.validade.value,
                cvv: form.cvv.value
            };
        }

        const vendaData = {
            clienteId: selectedClienteId,
            itens: cart.map(item => ({
                produto: item.produto._id,
                quantidade: item.quantidade,
                precoUnitario: item.produto.preco
            })),
            pagamento: { metodo: pagamentoMetodo, detalhes: pagamentoDetalhes, status: 'Aprovado' },
            enderecoEntrega: cliente.endereco, // Ensure the entire address object is sent
            valorTotal,
        };

        try {
            await api.post('/vendas', vendaData);
            alert('Venda registrada com sucesso!');
            resetModal();
            fetchVendasListData(); // Refresh the sales list
        } catch (err) {
            alert(err.response?.data?.msg || 'Erro ao criar a venda.');
        }
    };

    // --- Payment Form Component (from your code, with state integration) ---
    const PagamentoForm = () => (
         <div style={{ border: '1px solid var(--theme-border)', borderRadius: '8px', padding: '20px', marginTop: '20px' }}>
            <h4>Pagamento</h4>
             {/* Radio buttons now control the 'pagamentoMetodo' state */}
            <div className="input-group">
                 <input type="radio" id="pix" name="pagamento" value="PIX" checked={pagamentoMetodo === 'PIX'} onChange={e => setPagamentoMetodo(e.target.value)} />
                 <label htmlFor="pix" style={{marginLeft: '10px'}}>Pix</label>
             </div>
             <div className="input-group">
                 <input type="radio" id="gpay" name="pagamento" value="Google Pay" checked={pagamentoMetodo === 'Google Pay'} onChange={e => setPagamentoMetodo(e.target.value)} />
                 <label htmlFor="gpay" style={{marginLeft: '10px'}}>Google Pay</label>
             </div>
             <div className="input-group">
                 <input type="radio" id="cc" name="pagamento" value="Cartão de Crédito" checked={pagamentoMetodo === 'Cartão de Crédito'} onChange={e => setPagamentoMetodo(e.target.value)} />
                 <label htmlFor="cc" style={{marginLeft: '10px'}}>Cartão de crédito</label>
             </div>

            {/* Credit card fields only show if that method is selected */}
            {pagamentoMetodo === 'Cartão de Crédito' && (
                <div style={{ border: '1px solid var(--theme-border)', borderRadius: '8px', padding: '15px', marginTop: '10px' }}>
                    <div className="input-group"><label>Número do cartão</label><input name="numeroCartao" type="text" placeholder="0000 0000 0000 0000" required /></div>
                    <div className="input-group"><label>Nome do titular</label><input name="nomeTitular" type="text" placeholder="Nome como está no cartão" required/></div>
                    <div style={{display: 'flex', gap: '10px'}}>
                        <div className="input-group" style={{flex: 1}}><label>Validade</label><input name="validade" type="text" placeholder="MM/AA" required/></div>
                        <div className="input-group" style={{flex: 1}}><label>CVV</label><input name="cvv" type="text" placeholder="***" required /></div>
                    </div>
                </div>
            )}
         </div>
    );

    // --- Main Return ---
    return (
        <div>
            <div className="view-header"><h2>Gestão de Vendas</h2></div>

            {/* Action Bar with Tabs */}
            <div className="action-bar">
                <div className="filter-tabs">
                    <a href="#" className={`filter-tab ${activeTab === 'lista' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('lista'); }}>Lista de Vendas</a>
                    <a href="#" className={`filter-tab ${activeTab === 'relatorio' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('relatorio'); }}>Relatórios e Gráficos</a>
                </div>
                {/* Show 'Add Sale' button only on the list tab */}
                {activeTab === 'lista' && (
                     <button onClick={() => setAddModalVisible(true)} className="add-button">+ Registrar Nova Venda</button>
                )}
            </div>

            {/* Conditional Rendering based on activeTab */}
            {activeTab === 'lista' ? (
                loading ? <p style={styles.loadingText}>Carregando lista de vendas...</p> : ( // Use styled loading text
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr><th>Cliente</th><th>Valor Total</th><th>Itens</th><th>Status</th><th>Data</th><th style={{ textAlign: 'right' }}>Ações</th></tr>
                            </thead>
                            <tbody>
                                {vendas.map(venda => (
                                    <tr key={venda._id}>
                                        <td>{venda.cliente?.nome || 'Cliente não encontrado'}</td>
                                        <td>R$ {venda.valorTotal?.toFixed(2) || '0.00'}</td>
                                        <td>{venda.itens?.reduce((acc, item) => acc + item.quantidade, 0) || 0}</td>
                                        <td>{venda.status}</td>
                                        <td>{new Date(venda.createdAt).toLocaleDateString('pt-BR')}</td>
                                        <td className="actions" style={{textAlign: 'right'}}>
                                            {/* Add actual edit/delete functions if needed */}
                                            <ActionMenu onEdit={() => alert('Função Editar não implementada.')} onDelete={() => alert('Função Cancelar não implementada.')} />
                                        </td>
                                    </tr>
                                ))}
                                {vendas.length === 0 && (
                                    <tr><td colSpan="6" style={{ textAlign: 'center' }}>Nenhuma venda encontrada.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )
            ) : (
                // Render the Report Tab component for the 'relatorio' tab
                <RelatorioTab reportType="vendas" />
            )}

            {/* 'Add New Sale' Modal */}
            <Modal isVisible={isAddModalVisible} onClose={resetModal} title="Registrar Nova Venda">
                 {/* Increased minWidth for better layout */}
                 <div className="popup" style={{minWidth: '70vw', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column'}}>
                    <form onSubmit={handleCriarVenda} className="vertical-form" style={{overflowY: 'auto', paddingRight: '15px'}}> {/* Make form scrollable */}
                        <h4>Cliente e Produtos</h4>
                        {/* Client Selector */}
                        <div className="input-group">
                            <label>Cliente</label>
                            <select name="cliente" value={selectedClienteId} onChange={(e) => setSelectedClienteId(e.target.value)} required>
                                <option value="">Selecione um cliente</option>
                                {clientes.map(c => <option key={c._id} value={c._id}>{c.nome} ({c.email})</option>)}
                            </select>
                        </div>
                        {/* Product Selector and Add Button */}
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '15px' }}>
                            <div className="input-group" style={{ flex: 1, margin: 0 }}>
                                <label>Adicionar Produto</label>
                                <select value={currentProdutoId} onChange={(e) => setCurrentProdutoId(e.target.value)}>
                                    <option value="">Selecione um produto</option>
                                    {/* Display stock in the product option */}
                                    {produtos.map(p => <option key={p._id} value={p._id}>{p.nome} - {p.artista} (Estoque: {p.quantidade})</option>)}
                                </select>
                            </div>
                            <button type="button" onClick={handleAddToCart} className="add-button" style={{height: '45px'}}>+</button>
                        </div>
                        {/* Cart Display */}
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
                                                <td><button type="button" onClick={() => handleRemoveFromCart(item.produto._id)} className="delete-btn" style={{padding: '5px 10px'}}>X</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <h4 style={{textAlign: 'right', marginTop: '10px'}}>Total: R$ {valorTotal.toFixed(2)}</h4>
                            </div>
                        )}
                        {/* Payment Form */}
                        <PagamentoForm />
                        {/* Modal Actions */}
                        <div className="popup-actions" style={{marginTop: '20px'}}>
                            <button type="button" onClick={resetModal} className="delete-btn">Cancelar</button>
                            <button type="submit" className="add-button">Finalizar Venda</button>
                        </div>
                    </form>
                 </div>
            </Modal>
        </div>
    );
}

// Re-add the styles object from RelatorioTab for consistency if needed
const styles = {
     loadingText: { textAlign: 'center', padding: '40px 20px', color: '#6c757d', fontSize: '16px' },
     // Add other styles from RelatorioTab if you move them out of that component
};


export default VendasView;