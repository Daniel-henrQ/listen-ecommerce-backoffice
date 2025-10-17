// frontend/src/pages/ClientesView.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import ActionMenu from '../components/ActionMenu';

function ClientesView() {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalVisible, setAddModalVisible] = useState(false);
    const [isEditModalVisible, setEditModalVisible] = useState(false);
    const [editingCliente, setEditingCliente] = useState(null);

    const fetchClientes = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            const response = await api.get(`/clientes?${params.toString()}`);
            setClientes(response.data);
        } catch (err) {
            console.error("Erro ao buscar clientes:", err);
            // Adicionar feedback para o usuário, se necessário
        } finally {
            setLoading(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        fetchClientes();
    }, [fetchClientes]);

    const handleFormSubmit = async (e, id) => {
        e.preventDefault();
        const formData = Object.fromEntries(new FormData(e.target).entries());

        // Validação de senha para novos clientes
        if (!id && formData.password !== formData.confirmpassword) {
            alert("As senhas não conferem!");
            return;
        }

        try {
            if (id) {
                await api.put(`/clientes/${id}`, formData);
                setEditModalVisible(false);
            } else {
                await api.post('/clientes', formData);
                setAddModalVisible(false);
            }
            fetchClientes();
        } catch (err) {
            alert(err.response?.data?.msg || `Erro ao salvar cliente.`);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Tem certeza que deseja excluir este cliente?")) {
            try {
                await api.delete(`/clientes/${id}`);
                fetchClientes();
            } catch (err) {
                alert("Falha ao excluir cliente.");
            }
        }
    };

    const openEditModal = (cliente) => {
        setEditingCliente(cliente);
        setEditModalVisible(true);
    };

    const ClienteForm = ({ cliente, onSubmit, onCancel }) => (
        <form onSubmit={(e) => onSubmit(e, cliente?._id)} className="vertical-form">
            <div className="form-grid">
                <div>
                    <h4>Informações Pessoais</h4>
                    <div className="input-group"><label>Nome</label><input type="text" name="nome" defaultValue={cliente?.nome} required /></div>
                    <div className="input-group"><label>Sobrenome</label><input type="text" name="sobrenome" defaultValue={cliente?.sobrenome} /></div>
                    <div className="input-group"><label>Email</label><input type="email" name="email" defaultValue={cliente?.email} required /></div>
                    <div className="input-group"><label>CPF</label><input type="text" name="cpf" defaultValue={cliente?.cpf} /></div>
                    <div className="input-group"><label>Telefone</label><input type="text" name="telefone" defaultValue={cliente?.telefone} /></div>
                    <div className="input-group"><label>Data de Nascimento</label><input type="date" name="dataNascimento" defaultValue={cliente?.dataNascimento ? new Date(cliente.dataNascimento).toISOString().split('T')[0] : ''} /></div>
                </div>
                 <div>
                    <h4>Endereço de Entrega</h4>
                    <div className="input-group"><label>CEP</label><input type="text" name="endereco.cep" defaultValue={cliente?.endereco?.cep} /></div>
                    <div className="input-group"><label>Rua</label><input type="text" name="endereco.logradouro" defaultValue={cliente?.endereco?.logradouro} /></div>
                    <div className="input-group"><label>Número</label><input type="text" name="endereco.numero" defaultValue={cliente?.endereco?.numero} /></div>
                    <div className="input-group"><label>Complemento</label><input type="text" name="endereco.complemento" defaultValue={cliente?.endereco?.complemento} /></div>
                    <div className="input-group"><label>Bairro</label><input type="text" name="endereco.bairro" defaultValue={cliente?.endereco?.bairro} /></div>
                    <div className="input-group"><label>Cidade</label><input type="text" name="endereco.cidade" defaultValue={cliente?.endereco?.cidade} /></div>
                    <div className="input-group"><label>Estado</label><input type="text" name="endereco.estado" defaultValue={cliente?.endereco?.estado} /></div>
                </div>
            </div>

            {!cliente && ( // Campos de senha apenas para criação
                <>
                    <hr style={{margin: '20px 0', border: '1px solid #eee'}} />
                    <h4>Credenciais de Acesso</h4>
                     <div className="form-grid">
                        <div className="input-group"><label>Senha</label><input type="password" name="password" required /></div>
                        <div className="input-group"><label>Confirmar Senha</label><input type="password" name="confirmpassword" required /></div>
                    </div>
                </>
            )}

            <div className="popup-actions">
                <button type="button" onClick={onCancel} className="delete-btn">Cancelar</button>
                <button type="submit" className="add-button">Salvar</button>
            </div>
        </form>
    );

    if (loading) return <p>A carregar clientes...</p>;

    return (
        <div>
            <div className="view-header"><h2>Gestão de Clientes</h2></div>
            <div className="action-bar">
                <div className="search-box">
                    <input type="text" placeholder="Buscar por Nome, Email ou CPF..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <button onClick={() => setAddModalVisible(true)} className="add-button">+ ADD Novo Cliente</button>
            </div>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Nome Completo</th><th>Email</th><th>CPF</th><th>Telefone</th><th>Cidade</th><th style={{ textAlign: 'right' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clientes.map(cliente => (
                            <tr key={cliente._id}>
                                <td>{`${cliente.nome} ${cliente.sobrenome || ''}`}</td><td>{cliente.email}</td><td>{cliente.cpf}</td><td>{cliente.telefone}</td><td>{cliente.endereco?.cidade}</td>
                                <td className="actions" style={{textAlign: 'right'}}>
                                    <ActionMenu 
                                        onEdit={() => openEditModal(cliente)}
                                        onDelete={() => handleDelete(cliente._id)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isVisible={isAddModalVisible} onClose={() => setAddModalVisible(false)} title="Adicionar Novo Cliente">
                <div className="popup popup-fornecedor">
                    <ClienteForm onSubmit={handleFormSubmit} onCancel={() => setAddModalVisible(false)} />
                </div>
            </Modal>

            {editingCliente && (
                <Modal isVisible={isEditModalVisible} onClose={() => setEditModalVisible(false)} title="Editar Cliente">
                    <div className="popup popup-fornecedor">
                       <ClienteForm cliente={editingCliente} onSubmit={handleFormSubmit} onCancel={() => setEditModalVisible(false)} />
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default ClientesView;