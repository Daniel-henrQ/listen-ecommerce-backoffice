import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import ActionMenu from '../components/ActionMenu';

function VendasView() {
    const [vendas, setVendas] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [produtos, setProdutos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalVisible, setAddModalVisible] = useState(false);
    
    // State para o modal de nova venda
    const [selectedClienteId, setSelectedClienteId] = useState('');
    const [cart, setCart] = useState([]);
    const [currentProdutoId, setCurrentProdutoId] = useState('');

    const fetchInitialData = useCallback(async () => {
        setLoading(true);
        try {
            const [vendasRes, clientesRes, produtosRes] = await Promise.all([
                api.get('/vendas'),
                api.get('/clientes'),
                api.get('/produtos') 
            ]);
            setVendas(vendasRes.data);
            setClientes(clientesRes.data);
            setProdutos(produtosRes.data.filter(p => p.quantidade > 0)); // Apenas produtos com estoque
        } catch (err) {
            console.error("Erro ao buscar dados:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const handleAddToCart = () => {
        if (!currentProdutoId) return;
        const produtoToAdd = produtos.find(p => p._id === currentProdutoId);
        const existingItem = cart.find(item => item.produto._id === currentProdutoId);
        
        if (existingItem) {
            setCart(cart.map(item => 
                item.produto._id === currentProdutoId 
                ? { ...item, quantidade: item.quantidade + 1 } 
                : item
            ));
        } else {
            setCart([...cart, { produto: produtoToAdd, quantidade: 1 }]);
        }
        setCurrentProdutoId('');
    };
    
    const handleRemoveFromCart = (productId) => {
        setCart(cart.filter(item => item.produto._id !== productId));
    };

    const valorTotal = cart.reduce((total, item) => total + (item.produto.preco * item.quantidade), 0);

    const resetModal = () => {
        setSelectedClienteId('');
        setCart([]);
        setCurrentProdutoId('');
        setAddModalVisible(false);
    }

    const handleCriarVenda = async (e) => {
        e.preventDefault();
        
        const cliente = clientes.find(c => c._id === selectedClienteId);
        if (!cliente || !cliente.endereco || !cart.length) {
            alert("Por favor, selecione um cliente com endereço cadastrado e adicione produtos ao carrinho.");
            return;
        }

        const form = e.target;
        const pagamentoMetodo = form.pagamento.value;
        let pagamentoDetalhes = {};
        if (pagamentoMetodo === 'Cartão de Crédito') {
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
            pagamento: {
                metodo: pagamentoMetodo,
                detalhes: pagamentoDetalhes,
                status: 'Aprovado'
            },
            enderecoEntrega: cliente.endereco,
            valorTotal,
        };
        
        try {
            await api.post('/vendas', vendaData);
            alert('Venda registrada com sucesso!');
            resetModal();
            fetchInitialData();
        } catch (err) {
            alert(err.response?.data?.msg || 'Erro ao criar a venda.');
        }
    };
    
    // Formulário de Pagamento
    const PagamentoForm = () => (
         <div style={{ border: '1px solid var(--theme-border)', borderRadius: '8px', padding: '20px' }}>
            <h4>Pagamento</h4>
            <div className="input-group"><input type="radio" id="pix" name="pagamento" value="PIX" /><label htmlFor="pix" style={{marginLeft: '10px'}}>Pix</label></div>
            <div className="input-group"><input type="radio" id="gpay" name="pagamento" value="Google Pay" /><label htmlFor="gpay" style={{marginLeft: '10px'}}>Google Pay</label></div>
            <div className="input-group"><input type="radio" id="cc" name="pagamento" value="Cartão de Crédito" defaultChecked /><label htmlFor="cc" style={{marginLeft: '10px'}}>Cartão de crédito</label></div>
            <div style={{ border: '1px solid var(--theme-border)', borderRadius: '8px', padding: '15px', marginTop: '10px' }}>
                 <div className="input-group"><label>Número do cartão</label><input name="numeroCartao" type="text" placeholder="0000 0000 0000 0000" /></div>
                 <div className="input-group"><label>Nome do titular</label><input name="nomeTitular" type="text" placeholder="Nome como está no cartão" /></div>
                 <div style={{display: 'flex', gap: '10px'}}>
                    <div className="input-group" style={{flex: 1}}><label>Validade</label><input name="validade" type="text" placeholder="mm/aa" /></div>
                    <div className="input-group" style={{flex: 1}}><label>CVV</label><input name="cvv" type="text" placeholder="***" /></div>
                 </div>
            </div>
         </div>
    );

    if (loading) return <p>Carregando vendas...</p>;

    return (
        <div>
            <div className="view-header"><h2>Gestão de Vendas</h2></div>
            <div className="action-bar">
                <button onClick={() => setAddModalVisible(true)} className="add-button">+ Registrar Nova Venda</button>
            </div>
            <div className="table-container">
                <table>
                    <thead>
                        <tr><th>Cliente</th><th>Valor Total</th><th>Itens</th><th>Status</th><th>Data</th><th style={{ textAlign: 'right' }}>Ações</th></tr>
                    </thead>
                    <tbody>
                        {vendas.map(venda => (
                            <tr key={venda._id}>
                                <td>{venda.cliente?.nome}</td>
                                <td>R$ {venda.valorTotal.toFixed(2)}</td>
                                <td>{venda.itens.length}</td>
                                <td>{venda.status}</td>
                                <td>{new Date(venda.createdAt).toLocaleDateString('pt-BR')}</td>
                                <td className="actions" style={{textAlign: 'right'}}>
                                    <ActionMenu onEdit={() => alert('Função de editar venda não implementada.')} onDelete={() => alert('Função de cancelar venda não implementada.')} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isVisible={isAddModalVisible} onClose={resetModal} title="Registrar Nova Venda">
                 <div className="popup" style={{minWidth: '800px', maxHeight: '90vh', overflowY: 'auto'}}>
                    <form onSubmit={handleCriarVenda} className="vertical-form">
                        <h4>Cliente e Produtos</h4>
                        <div className="input-group">
                            <label>Cliente</label>
                            <select name="cliente" value={selectedClienteId} onChange={(e) => setSelectedClienteId(e.target.value)} required>
                                <option value="">Selecione um cliente</option>
                                {clientes.map(c => <option key={c._id} value={c._id}>{c.nome} ({c.email})</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '15px' }}>
                            <div className="input-group" style={{ flex: 1, margin: 0 }}>
                                <label>Adicionar Produto</label>
                                <select value={currentProdutoId} onChange={(e) => setCurrentProdutoId(e.target.value)}>
                                     <option value="">Selecione um produto</option>
                                     {produtos.map(p => <option key={p._id} value={p._id}>{p.nome} - {p.artista} (Estoque: {p.quantidade})</option>)}
                                </select>
                            </div>
                            <button type="button" onClick={handleAddToCart} className="add-button" style={{height: '45px'}}>+</button>
                        </div>
                        {cart.length > 0 && (
                            <div className="table-container" style={{marginBottom: '20px'}}>
                                <table>
                                    <thead><tr><th>Produto</th><th>Qtd</th><th>Preço</th><th>Subtotal</th><th></th></tr></thead>
                                    <tbody>
                                        {cart.map(item => (
                                            <tr key={item.produto._id}>
                                                <td>{item.produto.nome}</td><td>{item.quantidade}</td><td>R$ {item.produto.preco.toFixed(2)}</td><td>R$ {(item.produto.preco * item.quantidade).toFixed(2)}</td>
                                                <td><button type="button" onClick={() => handleRemoveFromCart(item.produto._id)} className="delete-btn" style={{padding: '5px 10px'}}>X</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <h4>Total: R$ {valorTotal.toFixed(2)}</h4>
                            </div>
                        )}
                        <hr style={{margin: '20px 0'}} />
                        <PagamentoForm />
                        <div className="popup-actions">
                            <button type="button" onClick={resetModal} className="delete-btn">Cancelar</button>
                            <button type="submit" className="add-button">Finalizar Venda</button>
                        </div>
                    </form>
                 </div>
            </Modal>
        </div>
    );
}

export default VendasView;