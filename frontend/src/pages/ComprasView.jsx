import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';

// Componente de abas
const StatusTabs = ({ activeTab, setActiveTab }) => {
    const statuses = ['Processando', 'A caminho', 'Entregue', 'Finalizada'];
    return (
        <div className="filter-tabs">
            {statuses.map(status => (
                <a
                    key={status}
                    href="#"
                    className={`filter-tab ${activeTab === status ? 'active' : ''}`}
                    onClick={(e) => {
                        e.preventDefault();
                        setActiveTab(status);
                    }}
                >
                    {status}
                </a>
            ))}
        </div>
    );
};


function ComprasView() {
    const [compras, setCompras] = useState([]);
    const [produtos, setProdutos] = useState([]);
    const [fornecedores, setFornecedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalVisible, setAddModalVisible] = useState(false);
    const [activeTab, setActiveTab] = useState('Processando'); // Estado para a aba ativa

    const fetchCompras = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/compras');
            setCompras(response.data);
        } catch (err) {
            console.error("Erro ao buscar compras:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        async function fetchData() {
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
                console.error("Erro ao carregar dados iniciais:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [fetchCompras]);

    const handleAddCompra = async (e) => {
        e.preventDefault();
        const formData = Object.fromEntries(new FormData(e.target).entries());
        try {
            await api.post('/compras', formData);
            setAddModalVisible(false);
            fetchCompras();
        } catch (err) {
            alert(err.response?.data?.msg || `Erro ao registrar compra.`);
        }
    };

    const handleGerarNota = async (compraId) => {
        try {
            const response = await api.get(`/compras/${compraId}/nota`, {
                responseType: 'blob', // Importante para receber o PDF como um blob
            });
            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            window.open(fileURL, '_blank');
        } catch (error) {
            console.error("Erro ao gerar nota fiscal:", error);
            alert("Não foi possível gerar a nota fiscal.");
        }
    };

    const handleUpdateStatus = async (compraId, newStatus) => {
        try {
            await api.patch(`/compras/${compraId}/status`, { status: newStatus });
            fetchCompras();
        } catch (error) {
            alert(error.response?.data?.msg || "Erro ao atualizar status da compra.");
        }
    };
    
    const handleApproveAndStock = async (compraId) => {
        if (window.confirm("Tem certeza que deseja finalizar esta compra e adicionar os produtos ao estoque? Esta ação não pode ser desfeita.")) {
            try {
                await api.post('/produtos/aprovar-compra', { compraId });
                fetchCompras(); // Atualiza a lista de compras
            } catch (error) {
                alert(error.response?.data?.msg || "Erro ao aprovar a compra e atualizar o estoque.");
            }
        }
    };

    const renderActionButtons = (compra) => {
        switch (compra.status) {
            case 'Processando':
                return <button className="btn btn-primary" onClick={() => handleUpdateStatus(compra._id, 'A caminho')}>Marcar como "A Caminho"</button>;
            case 'A caminho':
                return <button className="btn btn-primary" onClick={() => handleUpdateStatus(compra._id, 'Entregue')}>Marcar como "Entregue"</button>;
            case 'Entregue':
                return <button className="btn btn-success" onClick={() => handleApproveAndStock(compra._id)}>Aprovar e Adicionar ao Estoque</button>;
            default:
                return null;
        }
    };

    const filteredCompras = compras.filter(c => c.status === activeTab);

    if (loading) return <p>A carregar compras...</p>;

    return (
        <div>
            <div className="view-header"><h2>Registro de Compras</h2></div>
            <div className="action-bar">
                 <StatusTabs activeTab={activeTab} setActiveTab={setActiveTab} />
                <button onClick={() => setAddModalVisible(true)} className="add-button">+ Registrar Nova Compra</button>
            </div>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Nota Fiscal</th>
                            <th>Produto</th>
                            <th>Fornecedor</th>
                            <th>Comprador</th>
                            <th>Quantidade</th>
                            <th>Valor Total</th>
                            <th>Data</th>
                            <th style={{ textAlign: 'right' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCompras.map(compra => (
                            <tr key={compra._id}>
                                <td>{compra.numeroNotaFiscal}</td>
                                <td>{compra.produto?.nome}</td>
                                <td>{compra.fornecedor?.nomeFantasia}</td>
                                <td>{compra.comprador?.name}</td>
                                <td>{compra.quantidade}</td>
                                <td>R$ {compra.precoTotal.toFixed(2)}</td>
                                <td>{new Date(compra.dataCompra).toLocaleDateString('pt-BR')}</td>
                                <td className="actions" style={{display: 'flex', gap: '5px', justifyContent: 'flex-end'}}>
                                    {renderActionButtons(compra)}
                                    <button className="btn" onClick={() => handleGerarNota(compra._id)}>Gerar Nota</button>
                                </td>
                            </tr>
                        ))}
                         {filteredCompras.length === 0 && (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center' }}>Nenhuma compra encontrada para este status.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal de Adicionar Compra */}
            <Modal isVisible={isAddModalVisible} onClose={() => setAddModalVisible(false)} title="Registrar Nova Compra">
                <div className="popup">
                    <form onSubmit={handleAddCompra} className="vertical-form">
                        <div className="input-group">
                            <label>Produto</label>
                            <select name="produto" required>
                                <option value="">Selecione um produto</option>
                                {produtos.map(p => <option key={p._id} value={p._id}>{p.nome} - {p.artista}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Fornecedor</label>
                            <select name="fornecedor" required>
                                <option value="">Selecione um fornecedor</option>
                                {fornecedores.map(f => <option key={f._id} value={f._id}>{f.nomeFantasia}</option>)}
                            </select>
                        </div>
                        <div className="input-group"><label>Quantidade</label><input type="number" name="quantidade" required min="1" /></div>
                        <div className="input-group"><label>Preço Unitário</label><input type="number" name="precoUnitario" required min="0" step="0.01" /></div>
                        
                        <div className="popup-actions">
                            <button type="button" onClick={() => setAddModalVisible(false)} className="btn btn-secondary">Cancelar</button>
                            <button type="submit" className="add-button">Salvar</button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
}

export default ComprasView;