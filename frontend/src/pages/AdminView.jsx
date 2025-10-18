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

    // State for form messages and field errors
    const [formMessage, setFormMessage] = useState({ text: '', type: '' });
    const [fieldErrors, setFieldErrors] = useState({});

    const clearFormState = () => {
        setFormMessage({ text: '', type: '' });
        setFieldErrors({});
    };

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            const response = await api.get(`/admin/users?${params.toString()}`);
            setUsers(response.data);
        } catch (err) {
            console.error(err);
             // Aqui você pode definir uma mensagem de erro geral para a view, se desejar
        } finally {
            setLoading(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleAddUser = async (e) => {
        e.preventDefault();
        clearFormState(); // Limpa erros anteriores
        const formData = new FormData(e.target);
        const userData = Object.fromEntries(formData.entries());

        let errors = {};
        if (!userData.name?.trim()) errors.name = "Nome é obrigatório.";
        if (!userData.email?.trim() || !/\S+@\S+\.\S+/.test(userData.email)) errors.email = "Email inválido.";
        if (!userData.cpf?.trim()) errors.cpf = "CPF é obrigatório."; // Adicionar validação de formato se necessário
        if (!userData.password) errors.password = "Senha é obrigatória.";
        if (userData.password !== userData.confirmpassword) {
            errors.password = "As senhas não conferem.";
            errors.confirmpassword = "As senhas não conferem.";
        }
        if (!userData.role) errors.role = "Função é obrigatória.";


        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setFormMessage({ text: 'Por favor, corrija os erros no formulário.', type: 'error' });
            return;
        }

        try {
            const response = await api.post('/admin/users', userData);
            setFormMessage({ text: response.data.msg || 'Utilizador criado com sucesso!', type: 'success' });
            setTimeout(() => {
                setAddModalVisible(false);
                clearFormState(); // Limpa estado após fechar
            }, 1500); // Fecha após 1.5s
            fetchUsers(); // Atualiza a lista
        } catch (err) {
            const apiErrorMessage = err.response?.data?.msg || "Erro ao criar utilizador.";
            setFormMessage({ text: apiErrorMessage, type: 'error' });
            // Tenta mapear erros comuns da API para campos específicos
            if (apiErrorMessage.includes('e-mail')) {
                setFieldErrors(prev => ({ ...prev, email: 'Verifique o e-mail.' }));
            }
            if (apiErrorMessage.includes('CPF')) {
                setFieldErrors(prev => ({ ...prev, cpf: 'Verifique o CPF.' }));
            }
        }
    };

    const handleEditUser = async (e) => {
        e.preventDefault();
        clearFormState();
        const formData = new FormData(e.target);
        const userData = Object.fromEntries(formData.entries());

        let errors = {};
        if (!userData.name?.trim()) errors.name = "Nome é obrigatório.";
        if (!userData.email?.trim() || !/\S+@\S+\.\S+/.test(userData.email)) errors.email = "Email inválido.";
        if (!userData.cpf?.trim()) errors.cpf = "CPF é obrigatório.";
        if (!userData.role) errors.role = "Função é obrigatória.";

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
             setFormMessage({ text: 'Por favor, corrija os erros no formulário.', type: 'error' });
            return;
        }


        try {
            const response = await api.put(`/admin/users/${editingUser._id}`, userData);
            setFormMessage({ text: response.data.msg || 'Utilizador atualizado com sucesso!', type: 'success' });
             setTimeout(() => {
                 setEditModalVisible(false);
                 clearFormState();
             }, 1500);
            fetchUsers();
        } catch (err) {
             const apiErrorMessage = err.response?.data?.msg || "Erro ao atualizar utilizador.";
             setFormMessage({ text: apiErrorMessage, type: 'error' });
             if (apiErrorMessage.includes('e-mail')) {
                 setFieldErrors(prev => ({ ...prev, email: 'Verifique o e-mail.' }));
             }
             if (apiErrorMessage.includes('CPF')) {
                 setFieldErrors(prev => ({ ...prev, cpf: 'Verifique o CPF.' }));
             }
        }
    };

    // Recebe userId diretamente do ActionMenu
    const handleDeleteUser = async (userId) => {
        if (window.confirm("Tem a certeza que deseja excluir este utilizador?")) {
            try {
                await api.delete(`/admin/users/${userId}`);
                fetchUsers(); // Atualiza a lista após exclusão
            } catch (err) {
                alert("Falha ao excluir utilizador.");
            }
        }
    };

    // Recebe userId diretamente do ActionMenu
    const openEditModal = (userId) => {
         const userToEdit = users.find(u => u._id === userId);
         if (userToEdit) {
            setEditingUser(userToEdit);
            clearFormState(); // Limpa erros ao abrir modal de edição
            setEditModalVisible(true);
         } else {
             console.error("Utilizador não encontrado para edição");
             alert("Erro: Utilizador não encontrado.");
         }
    };

     const openAddModal = () => {
         clearFormState(); // Limpa erros ao abrir modal de adição
         setAddModalVisible(true);
     };

    if (loading && users.length === 0) return <p>A carregar utilizadores...</p>; // Mostrar loading inicial

    return (
        <div>
            <div className="view-header"><h2>Gestão de Utilizadores</h2></div>
            <div className="action-bar">
                <div className="search-box">
                    <input type="text" placeholder="Buscar por nome ou email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                {/* Usar a função que limpa o estado */}
                <button onClick={openAddModal} className="add-button">+ ADD Novo Utilizador</button>
            </div>
            {loading && <p style={{textAlign: 'center'}}>Atualizando lista...</p>}
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
                        {users.length === 0 && !loading ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center' }}>Nenhum utilizador encontrado.</td></tr>
                        ) : (
                            users.map(user => (
                                <tr key={user._id}>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>{user.cpf}</td>
                                    <td>{user.role}</td>
                                    <td className="actions"> {/* Não precisa mais de style={{textAlign: 'right'}} aqui */}
                                        <ActionMenu
                                            itemId={user._id} // Passa o ID diretamente
                                            onEdit={openEditModal} // Função já recebe ID
                                            onDelete={handleDeleteUser} // Função já recebe ID
                                        />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Adicionar */}
            <Modal isVisible={isAddModalVisible} onClose={() => setAddModalVisible(false)} title="Adicionar Novo Utilizador">
                 <div className="popup"> {/* Adicione a classe popup */}
                    <form className="vertical-form" onSubmit={handleAddUser} noValidate> {/* noValidate para permitir controle total */}
                        <div className="input-group">
                            <label htmlFor="add-name" className="required">Nome Completo</label>
                            <input id="add-name" type="text" name="name" className={fieldErrors.name ? 'input-error' : ''} required />
                             {fieldErrors.name && <span className="error-message-text">{fieldErrors.name}</span>}
                        </div>
                        <div className="input-group">
                            <label htmlFor="add-email" className="required">Email</label>
                            <input id="add-email" type="email" name="email" className={fieldErrors.email ? 'input-error' : ''} required />
                            {fieldErrors.email && <span className="error-message-text">{fieldErrors.email}</span>}
                        </div>
                        <div className="input-group">
                            <label htmlFor="add-cpf" className="required">CPF</label>
                            <input id="add-cpf" type="text" name="cpf" className={fieldErrors.cpf ? 'input-error' : ''} required />
                            {fieldErrors.cpf && <span className="error-message-text">{fieldErrors.cpf}</span>}
                        </div>
                        <div className="input-group">
                            <label htmlFor="add-password" className="required">Senha</label>
                            <input id="add-password" type="password" name="password" className={fieldErrors.password ? 'input-error' : ''} required />
                             {fieldErrors.password && <span className="error-message-text">{fieldErrors.password}</span>}
                        </div>
                        <div className="input-group">
                            <label htmlFor="add-confirmpassword" className="required">Confirmar Senha</label>
                            <input id="add-confirmpassword" type="password" name="confirmpassword" className={fieldErrors.confirmpassword ? 'input-error' : ''} required />
                            {fieldErrors.confirmpassword && <span className="error-message-text">{fieldErrors.confirmpassword}</span>}
                        </div>
                        <div className="input-group">
                            <label htmlFor="add-role" className="required">Função</label>
                            <select id="add-role" name="role" className={fieldErrors.role ? 'input-error' : ''} required>
                                <option value="">Selecione...</option> {/* Boa prática */}
                                <option value="vendas">Vendas</option>
                                <option value="adm">Admin</option>
                            </select>
                             {fieldErrors.role && <span className="error-message-text">{fieldErrors.role}</span>}
                        </div>
                         {formMessage.text && <p className={`form-message ${formMessage.type}`}>{formMessage.text}</p>}
                        <div className="popup-actions">
                            <button type="button" onClick={() => setAddModalVisible(false)} className="delete-btn">Cancelar</button>
                            <button type="submit" className="add-button">Criar Utilizador</button>
                        </div>
                    </form>
                 </div>
            </Modal>

            {/* Modal Editar */}
            {editingUser && (
                 <Modal isVisible={isEditModalVisible} onClose={() => setEditModalVisible(false)} title="Editar Utilizador">
                    <div className="popup">
                        <form className="vertical-form" onSubmit={handleEditUser} noValidate>
                            {/* Não incluir campos de senha na edição aqui */}
                            <div className="input-group">
                                <label htmlFor="edit-name" className="required">Nome Completo</label>
                                <input id="edit-name" type="text" name="name" defaultValue={editingUser.name} className={fieldErrors.name ? 'input-error' : ''} required />
                                {fieldErrors.name && <span className="error-message-text">{fieldErrors.name}</span>}
                            </div>
                            <div className="input-group">
                                <label htmlFor="edit-email" className="required">Email</label>
                                <input id="edit-email" type="email" name="email" defaultValue={editingUser.email} className={fieldErrors.email ? 'input-error' : ''} required />
                                 {fieldErrors.email && <span className="error-message-text">{fieldErrors.email}</span>}
                            </div>
                            <div className="input-group">
                                <label htmlFor="edit-cpf" className="required">CPF</label>
                                <input id="edit-cpf" type="text" name="cpf" defaultValue={editingUser.cpf} className={fieldErrors.cpf ? 'input-error' : ''} required />
                                {fieldErrors.cpf && <span className="error-message-text">{fieldErrors.cpf}</span>}
                            </div>
                            <div className="input-group">
                                <label htmlFor="edit-role" className="required">Função</label>
                                <select id="edit-role" name="role" defaultValue={editingUser.role} className={fieldErrors.role ? 'input-error' : ''} required>
                                     <option value="">Selecione...</option>
                                    <option value="vendas">Vendas</option>
                                    <option value="adm">Admin</option>
                                </select>
                                {fieldErrors.role && <span className="error-message-text">{fieldErrors.role}</span>}
                            </div>
                             {formMessage.text && <p className={`form-message ${formMessage.type}`}>{formMessage.text}</p>}
                            <div className="popup-actions">
                                <button type="button" onClick={() => setEditModalVisible(false)} className="delete-btn">Cancelar</button>
                                <button type="submit" className="add-button">Salvar Alterações</button>
                            </div>
                        </form>
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default AdminView;