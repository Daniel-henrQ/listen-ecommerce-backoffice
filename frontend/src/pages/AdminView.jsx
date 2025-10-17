import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import ActionMenu from '../components/ActionMenu';

function AdminView() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalVisible, setAddModalVisible] = useState(false);
    const [isEditModalVisible, setEditModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            const response = await api.get(`/admin/users?${params.toString()}`);
            setUsers(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleAddUser = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const userData = Object.fromEntries(formData.entries());
        if (userData.password !== userData.confirmpassword) return alert("As senhas não conferem!");
        try {
            await api.post('/admin/users', userData);
            setAddModalVisible(false);
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.msg || "Erro ao criar utilizador.");
        }
    };
    
    const handleEditUser = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const userData = Object.fromEntries(formData.entries());
        try {
            await api.put(`/admin/users/${editingUser._id}`, userData);
            setEditModalVisible(false);
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.msg || "Erro ao atualizar utilizador.");
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm("Tem a certeza?")) {
            try {
                await api.delete(`/admin/users/${userId}`);
                fetchUsers();
            } catch (err) {
                alert("Falha ao excluir utilizador.");
            }
        }
    };
    
    const openEditModal = (user) => {
        setEditingUser(user);
        setEditModalVisible(true);
    };

    if (loading) return <p>A carregar utilizadores...</p>;

    return (
        <div>
            <div className="view-header"><h2>Gestão de Utilizadores</h2></div>
            <div className="action-bar">
                <div className="search-box">
                    <input type="text" placeholder="Buscar por nome ou email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <button onClick={() => setAddModalVisible(true)} className="add-button">+ ADD Novo Utilizador</button>
            </div>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>CPF</th>
                            <th>Função</th>
                            <th style={{ textAlign: 'right' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user._id}>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>{user.cpf}</td>
                                <td>{user.role}</td>
                                <td className="actions" style={{textAlign: 'right'}}>
                                    <ActionMenu 
                                        onEdit={() => openEditModal(user)}
                                        onDelete={() => handleDeleteUser(user._id)} 
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isVisible={isAddModalVisible} onClose={() => setAddModalVisible(false)} title="Adicionar Novo Utilizador">
                <form className="vertical-form" onSubmit={handleAddUser}>
                    <div className="input-group"><label>Nome Completo</label><input type="text" name="name" required /></div>
                    <div className="input-group"><label>Email</label><input type="email" name="email" required /></div>
                    <div className="input-group"><label>CPF</label><input type="text" name="cpf" required /></div>
                    <div className="input-group"><label>Senha</label><input type="password" name="password" required /></div>
                    <div className="input-group"><label>Confirmar Senha</label><input type="password" name="confirmpassword" required /></div>
                    <div className="input-group">
                        <label>Função</label>
                        <select name="role" required>
                            <option value="vendas">Vendas</option>
                            <option value="adm">Admin</option>
                        </select>
                    </div>
                    <div className="popup-actions">
                        <button type="button" onClick={() => setAddModalVisible(false)} className="delete-btn">Cancelar</button>
                        <button type="submit" className="add-button">Criar Utilizador</button>
                    </div>
                </form>
            </Modal>
            
            {editingUser && (
                 <Modal isVisible={isEditModalVisible} onClose={() => setEditModalVisible(false)} title="Editar Utilizador">
                    <form className="vertical-form" onSubmit={handleEditUser}>
                        <div className="input-group"><label>Nome Completo</label><input type="text" name="name" defaultValue={editingUser.name} required /></div>
                        <div className="input-group"><label>Email</label><input type="email" name="email" defaultValue={editingUser.email} required /></div>
                        <div className="input-group"><label>CPF</label><input type="text" name="cpf" defaultValue={editingUser.cpf} required /></div>
                        <div className="input-group">
                            <label>Função</label>
                            <select name="role" defaultValue={editingUser.role} required>
                                <option value="vendas">Vendas</option>
                                <option value="adm">Admin</option>
                            </select>
                        </div>
                         <div className="popup-actions">
                            <button type="button" onClick={() => setEditModalVisible(false)} className="delete-btn">Cancelar</button>
                            <button type="submit" className="add-button">Salvar Alterações</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

export default AdminView;