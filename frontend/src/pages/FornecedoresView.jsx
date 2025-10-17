import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import ActionMenu from '../components/ActionMenu';

function FornecedoresView() {
    const [fornecedores, setFornecedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalVisible, setAddModalVisible] = useState(false);
    const [isEditModalVisible, setEditModalVisible] = useState(false);
    const [editingFornecedor, setEditingFornecedor] = useState(null);

    const fetchFornecedores = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            const response = await api.get(`/fornecedores?${params.toString()}`);
            setFornecedores(response.data);
        } catch (err) {
            console.error("Erro ao buscar fornecedores:", err);
        } finally {
            setLoading(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        fetchFornecedores();
    }, [fetchFornecedores]);

    const handleFormSubmit = async (e, id) => {
        e.preventDefault();
        const formData = Object.fromEntries(new FormData(e.target).entries());
        const data = {
            ...formData,
            endereco: {
                logradouro: formData.logradouro,
                numero: formData.numero,
                complemento: formData.complemento,
                bairro: formData.bairro,
                cidade: formData.cidade,
                estado: formData.estado,
                cep: formData.cep,
            }
        };

        try {
            if (id) {
                // Edição
                await api.put(`/fornecedores/${id}`, data);
                setEditModalVisible(false);
            } else {
                // Adição
                await api.post('/fornecedores', data);
                setAddModalVisible(false);
            }
            fetchFornecedores();
        } catch (err) {
            alert(err.response?.data?.msg || `Erro ao salvar fornecedor.`);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Tem a certeza que deseja excluir este fornecedor?")) {
            try {
                await api.delete(`/fornecedores/${id}`);
                fetchFornecedores();
            } catch (err) {
                alert("Falha ao excluir fornecedor.");
            }
        }
    };

    const openEditModal = (fornecedor) => {
        setEditingFornecedor(fornecedor);
        setEditModalVisible(true);
    };
    
    // Componente do formulário para reutilização
    const FornecedorForm = ({ fornecedor, onSubmit, onCancel }) => (
        <form onSubmit={(e) => onSubmit(e, fornecedor?._id)} className="vertical-form">
            <div className="form-grid">
                <div>
                    <h4>Informações Principais</h4>
                    <div className="input-group"><label>Nome Fantasia</label><input type="text" name="nomeFantasia" defaultValue={fornecedor?.nomeFantasia} required /></div>
                    <div className="input-group"><label>Razão Social</label><input type="text" name="razaoSocial" defaultValue={fornecedor?.razaoSocial} required /></div>
                    <div className="input-group"><label>CNPJ</label><input type="text" name="cnpj" defaultValue={fornecedor?.cnpj} required /></div>
                    <div className="input-group"><label>Email</label><input type="email" name="email" defaultValue={fornecedor?.email} required /></div>
                    <div className="input-group"><label>Telefone</label><input type="text" name="telefone" defaultValue={fornecedor?.telefone} required /></div>
                    <div className="input-group"><label>Pessoa de Contato</label><input type="text" name="pessoaContato" defaultValue={fornecedor?.pessoaContato} /></div>
                </div>
                <div>
                    <h4>Endereço</h4>
                    <div className="input-group"><label>CEP</label><input type="text" name="cep" defaultValue={fornecedor?.endereco?.cep} /></div>
                    <div className="input-group"><label>Logradouro</label><input type="text" name="logradouro" defaultValue={fornecedor?.endereco?.logradouro} /></div>
                    <div className="input-group"><label>Número</label><input type="text" name="numero" defaultValue={fornecedor?.endereco?.numero} /></div>
                    <div className="input-group"><label>Complemento</label><input type="text" name="complemento" defaultValue={fornecedor?.endereco?.complemento} /></div>
                    <div className="input-group"><label>Bairro</label><input type="text" name="bairro" defaultValue={fornecedor?.endereco?.bairro} /></div>
                    <div className="input-group"><label>Cidade</label><input type="text" name="cidade" defaultValue={fornecedor?.endereco?.cidade} required /></div>
                    <div className="input-group"><label>Estado</label><input type="text" name="estado" defaultValue={fornecedor?.endereco?.estado} required /></div>
                </div>
            </div>
            <div className="popup-actions">
                <button type="button" onClick={onCancel} className="delete-btn">Cancelar</button>
                <button type="submit" className="add-button">Salvar</button>
            </div>
        </form>
    );

    if (loading) return <p>A carregar fornecedores...</p>;

    return (
        <div>
            <div className="view-header"><h2>Fornecedores</h2></div>
            <div className="action-bar">
                <div className="search-box">
                    <input type="text" placeholder="Buscar por Nome, Razão Social ou CNPJ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <button onClick={() => setAddModalVisible(true)} className="add-button">+ ADD Novo Fornecedor</button>
            </div>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Nome Fantasia</th><th>CNPJ</th><th>Email</th><th>Telefone</th><th>Cidade</th><th style={{ textAlign: 'right' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fornecedores.map(fornecedor => (
                            <tr key={fornecedor._id}>
                                <td>{fornecedor.nomeFantasia}</td><td>{fornecedor.cnpj}</td><td>{fornecedor.email}</td><td>{fornecedor.telefone}</td><td>{fornecedor.endereco?.cidade}</td>
                                <td className="actions" style={{textAlign: 'right'}}>
                                    <ActionMenu 
                                        onEdit={() => openEditModal(fornecedor)}
                                        onDelete={() => handleDelete(fornecedor._id)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal de Adicionar */}
            <Modal isVisible={isAddModalVisible} onClose={() => setAddModalVisible(false)} title="Adicionar Novo Fornecedor">
                <div className="popup popup-fornecedor">
                    <FornecedorForm onSubmit={handleFormSubmit} onCancel={() => setAddModalVisible(false)} />
                </div>
            </Modal>

            {/* Modal de Editar */}
            {editingFornecedor && (
                <Modal isVisible={isEditModalVisible} onClose={() => setEditModalVisible(false)} title="Editar Fornecedor">
                    <div className="popup popup-fornecedor">
                       <FornecedorForm fornecedor={editingFornecedor} onSubmit={handleFormSubmit} onCancel={() => setEditModalVisible(false)} />
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default FornecedoresView;