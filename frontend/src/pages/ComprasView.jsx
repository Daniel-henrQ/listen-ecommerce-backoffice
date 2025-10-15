import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';


function ComprasView() {
    const [compras, setCompras] = useState([]);
    const [produtos, setProdutos] = useState([]);
    const [fornecedores, setFornecedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalVisible, setAddModalVisible] = useState(false);

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
    }, []);

    const handleAddCompra = async (e) => {
        e.preventDefault();
        const formData = Object.fromEntries(new FormData(e.target).entries());
        try {
            await api.post('/compras', formData);
            setAddModalVisible(false);
            fetchCompras(); // Recarrega a lista de compras
        } catch (err) {
            alert(err.response?.data?.msg || `Erro ao registrar compra.`);
        }
    };

    const handleGerarNota = (compraId) => {
        // Abre o PDF em uma nova aba
        window.open(`/api/compras/${compraId}/nota`, '_blank');
    };

    if (loading) return <p>A carregar compras...</p>;

    return (
        <div>
            <div className="view-header"><h2>Registro de Compras</h2></div>
            <div className="action-bar">
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
                        {compras.map(compra => (
                            <tr key={compra._id}>
                                <td>{compra.numeroNotaFiscal}</td>
                                <td>{compra.produto?.nome}</td>
                                <td>{compra.fornecedor?.nomeFantasia}</td>
                                <td>{compra.comprador?.name}</td>
                                <td>{compra.quantidade}</td>
                                <td>R$ {compra.precoTotal.toFixed(2)}</td>
                                <td>{new Date(compra.dataCompra).toLocaleDateString('pt-BR')}</td>
                                <td className="actions">
                                    <button className="btn" onClick={() => handleGerarNota(compra._id)}>Gerar Nota</button>
                                </td>
                            </tr>
                        ))}
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