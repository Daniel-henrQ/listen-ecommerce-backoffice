import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import RelatorioTab from '../components/RelatorioTab'; // Importa a nova aba

function ComprasView() {
    const [activeView, setActiveView] = useState('lista'); // 'lista' ou 'relatorio'
    const [compras, setCompras] = useState([]);
    const [produtos, setProdutos] = useState([]);
    const [fornecedores, setFornecedores] = useState([]);
    const [loading, setLoading] = useState(false); // Mudado para false
    const [isAddModalVisible, setAddModalVisible] = useState(false);
    const [activeStatusTab, setActiveStatusTab] = useState('Processando');
    const [isNewProduct, setIsNewProduct] = useState(false);

    const fetchComprasData = useCallback(async () => {
        setLoading(true); // Define loading true
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
            setLoading(false); // Define loading false
        }
    }, []);

    useEffect(() => {
        if (activeView === 'lista') {
            fetchComprasData();
        }
    }, [activeView, fetchComprasData]);

    // ... (Mantenha todos os seus handlers existentes: handleAddCompra, handleGerarNota, handleUpdateStatus, handleApproveAndStock, renderActionButtons)
     const handleAddCompra = async (e) => { /* ... sua lógica ... */ };
     const handleGerarNota = async (compraId) => { /* ... sua lógica ... */ };
     const handleUpdateStatus = async (compraId, newStatus) => { /* ... sua lógica ... */ };
     const handleApproveAndStock = async (compraId) => { /* ... sua lógica ... */ };
     const renderActionButtons = (compra) => { /* ... sua lógica ... */ };

    const StatusTabs = ({ activeTab, setActiveTab }) => {
        const statuses = ['Processando', 'A caminho', 'Entregue', 'Finalizada'];
        return (<div className="filter-tabs">{statuses.map(status => (<a key={status} href="#" className={`filter-tab ${activeTab === status ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab(status); }}>{status}</a>))}</div>);
    };

    const filteredCompras = compras.filter(c => c.status === activeStatusTab);

    return (
        <div>
            <div className="view-header"><h2>Registro de Compras</h2></div>

            <div className="action-bar" style={{flexDirection: 'column', alignItems: 'stretch'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                    <div className="filter-tabs">
                        <a href="#" className={`filter-tab ${activeView === 'lista' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveView('lista'); }}>Lista de Compras</a>
                        <a href="#" className={`filter-tab ${activeView === 'relatorio' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveView('relatorio'); }}>Relatórios e Gráficos</a>
                    </div>
                    {activeView === 'lista' && (
                        <button onClick={() => setAddModalVisible(true)} className="add-button">+ Registrar Nova Compra</button>
                    )}
                </div>
                {activeView === 'lista' && (
                     <div style={{width: '100%', borderTop: '1px solid var(--theme-border)', marginTop: '15px', paddingTop: '15px'}}>
                        <StatusTabs activeTab={activeStatusTab} setActiveTab={setActiveStatusTab} />
                     </div>
                )}
            </div>

            {/* Renderização Condicional */}
            {activeView === 'lista' ? (
                loading ? <p>A carregar lista de compras...</p> : (
                    <div className="table-container">
                        <table>
                           {/* ... Sua tabela de compras ... */}
                            <thead><tr><th>Nota Fiscal</th><th>Produto</th><th>Fornecedor</th><th>Comprador</th><th>Quantidade</th><th>Valor Total</th><th>Data</th><th style={{ textAlign: 'right' }}>Ações</th></tr></thead>
                            <tbody>
                                {filteredCompras.length > 0 ? filteredCompras.map(compra => (
                                    <tr key={compra._id}>
                                        <td>{compra.numeroNotaFiscal}</td><td>{compra.produto?.nome}</td><td>{compra.fornecedor?.nomeFantasia}</td><td>{compra.comprador?.name}</td><td>{compra.quantidade}</td><td>R$ {compra.precoTotal.toFixed(2)}</td><td>{new Date(compra.dataCompra).toLocaleDateString('pt-BR')}</td>
                                        <td className="actions" style={{display: 'flex', gap: '5px', justifyContent: 'flex-end'}}>
                                            {renderActionButtons(compra)}
                                            <button className="add-button" onClick={() => handleGerarNota(compra._id)}>Gerar Nota</button>
                                        </td>
                                    </tr>
                                )) : ( <tr><td colSpan="8" style={{ textAlign: 'center' }}>Nenhuma compra encontrada para este status.</td></tr> )}
                            </tbody>
                        </table>
                    </div>
                )
            ) : (
                // *** Passa a prop reportType="compras" ***
                <RelatorioTab reportType="compras" />
            )}

            {/* Modal de Adicionar Compra */}
            <Modal isVisible={isAddModalVisible} onClose={() => { setAddModalVisible(false); setIsNewProduct(false); }} title="Registrar Nova Compra">
                {/* ... conteúdo do seu modal ... */}
                 <div className="popup">
                    <form onSubmit={handleAddCompra} className="vertical-form">
                         {/* ... campos do formulário ... */}
                         <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}><input type="checkbox" id="is-new-product-checkbox" style={{ marginRight: '10px', height: '16px', width: '16px' }} checked={isNewProduct} onChange={(e) => setIsNewProduct(e.target.checked)} /><label htmlFor="is-new-product-checkbox" style={{ fontWeight: 'normal' }}>Cadastrar novo produto</label></div>
                        {isNewProduct ? (<>{/* ... campos novo produto ... */}</>) : (<div className="input-group"><label>Produto Existente</label><select name="produto" required><option value="">Selecione um produto</option>{produtos.map(p => <option key={p._id} value={p._id}>{p.nome} - {p.artista}</option>)}</select></div>)}
                        <hr style={{margin: '25px 0', border: 'none', borderTop: '1px solid var(--theme-border)'}} />
                        <div className="input-group"><label>Fornecedor</label><select name="fornecedor" required><option value="">Selecione um fornecedor</option>{fornecedores.map(f => <option key={f._id} value={f._id}>{f.nomeFantasia}</option>)}</select></div>
                        <div className="input-group"><label>Quantidade</label><input type="number" name="quantidade" required min="1" /></div>
                        <div className="input-group"><label>Preço Unitário (R$)</label><input type="number" name="precoUnitario" required min="0" step="0.01" /></div>
                        <div className="popup-actions"><button type="button" onClick={() => { setAddModalVisible(false); setIsNewProduct(false); }} className="delete-btn">Cancelar</button><button type="submit" className="add-button">Salvar Compra</button></div>
                    </form>
                </div>
            </Modal>
        </div>
    );
}

export default ComprasView;