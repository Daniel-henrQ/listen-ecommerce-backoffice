import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import ActionMenu from '../components/ActionMenu';

// --- Componente FornecedorForm Refatorado ---
const FornecedorForm = ({ fornecedor, onSubmit, onCancel }) => {
    // State para erros e mensagens do formulário
    const [fieldErrors, setFieldErrors] = useState({});
    const [formMessage, setFormMessage] = useState({ text: '', type: '' });

     // Limpa o estado do formulário
     const clearFormState = () => {
         setFieldErrors({});
         setFormMessage({ text: '', type: '' });
     };

     // Limpar erros quando o fornecedor mudar (ao abrir modal)
     useEffect(() => {
         clearFormState();
     }, [fornecedor]);

    const handleFormSubmitInternal = async (e) => {
        e.preventDefault();
        clearFormState(); // Limpa erros antes de submeter
        const formData = new FormData(e.target);
        const formProps = Object.fromEntries(formData.entries());

        let errors = {};
        // Adicionar validações frontend básicas aqui...
        if (!formProps.nomeFantasia?.trim()) errors.nomeFantasia = "Nome fantasia é obrigatório.";
        if (!formProps.razaoSocial?.trim()) errors.razaoSocial = "Razão social é obrigatória.";
        if (!formProps.cnpj?.trim()) errors.cnpj = "CNPJ é obrigatório."; // Poderia adicionar validação de formato
        if (!formProps.email?.trim() || !/\S+@\S+\.\S+/.test(formProps.email)) errors.email = "Email inválido.";
        if (!formProps.telefone?.trim()) errors.telefone = "Telefone é obrigatório.";
        if (!formProps.cidade?.trim()) errors.cidade = "Cidade é obrigatória.";
        if (!formProps.estado?.trim()) errors.estado = "Estado é obrigatório.";
         if (formProps.cep && !/^\d{5}-?\d{3}$/.test(formProps.cep)) {
             errors.cep = "Formato de CEP inválido.";
         }
        // ...

        setFieldErrors(errors);

        if (Object.keys(errors).length > 0) {
            setFormMessage({ text: 'Por favor, corrija os erros no formulário.', type: 'error' });
            return;
        }

        // Monta o objeto final para a API
        const data = {
            nomeFantasia: formProps.nomeFantasia,
            razaoSocial: formProps.razaoSocial,
            cnpj: formProps.cnpj,
            email: formProps.email,
            telefone: formProps.telefone,
            pessoaContato: formProps.pessoaContato,
            endereco: {
                logradouro: formProps.logradouro,
                numero: formProps.numero,
                complemento: formProps.complemento,
                bairro: formProps.bairro,
                cidade: formProps.cidade,
                estado: formProps.estado,
                cep: formProps.cep,
            }
        };

        try {
            await onSubmit(fornecedor?._id, data); // Chama a função do pai
             setFormMessage({ text: fornecedor ? 'Fornecedor atualizado com sucesso!' : 'Fornecedor criado com sucesso!', type: 'success' });
             // Lógica de fechar modal fica no pai
        } catch (err) {
             const apiErrorMessage = err.response?.data?.msg || `Erro ao salvar fornecedor.`;
             setFormMessage({ text: apiErrorMessage, type: 'error' });
             // Mapeamento de erros comuns da API
             if (apiErrorMessage.includes('CNPJ')) setFieldErrors(prev => ({ ...prev, cnpj: 'Verifique o CNPJ.' }));
             if (apiErrorMessage.includes('Razão Social') || apiErrorMessage.includes('razaoSocial')) setFieldErrors(prev => ({ ...prev, razaoSocial: 'Verifique a Razão Social.' }));
             if (apiErrorMessage.includes('e-mail')) setFieldErrors(prev => ({ ...prev, email: 'Verifique o e-mail.' }));
        }
    };

    return (
        <form onSubmit={handleFormSubmitInternal} className="vertical-form">
            <div className="form-grid">
                {/* --- Coluna Informações Principais --- */}
                <div>
                    <h4>Informações Principais</h4>
                    <div className="input-group">
                        <label htmlFor={`nomeFantasia-${fornecedor?._id || 'add'}`} className="required">Nome Fantasia</label>
                        <input id={`nomeFantasia-${fornecedor?._id || 'add'}`} type="text" name="nomeFantasia" defaultValue={fornecedor?.nomeFantasia} className={fieldErrors.nomeFantasia ? 'input-error' : ''} required />
                        {fieldErrors.nomeFantasia && <span className="error-message-text">{fieldErrors.nomeFantasia}</span>}
                    </div>
                    <div className="input-group">
                        <label htmlFor={`razaoSocial-${fornecedor?._id || 'add'}`} className="required">Razão Social</label>
                        <input id={`razaoSocial-${fornecedor?._id || 'add'}`} type="text" name="razaoSocial" defaultValue={fornecedor?.razaoSocial} className={fieldErrors.razaoSocial ? 'input-error' : ''} required />
                        {fieldErrors.razaoSocial && <span className="error-message-text">{fieldErrors.razaoSocial}</span>}
                    </div>
                    <div className="input-group">
                        <label htmlFor={`cnpj-${fornecedor?._id || 'add'}`} className="required">CNPJ</label>
                        <input id={`cnpj-${fornecedor?._id || 'add'}`} type="text" name="cnpj" defaultValue={fornecedor?.cnpj} className={fieldErrors.cnpj ? 'input-error' : ''} required />
                        {fieldErrors.cnpj && <span className="error-message-text">{fieldErrors.cnpj}</span>}
                    </div>
                    <div className="input-group">
                        <label htmlFor={`email-${fornecedor?._id || 'add'}`} className="required">Email</label>
                        <input id={`email-${fornecedor?._id || 'add'}`} type="email" name="email" defaultValue={fornecedor?.email} className={fieldErrors.email ? 'input-error' : ''} required />
                        {fieldErrors.email && <span className="error-message-text">{fieldErrors.email}</span>}
                    </div>
                    <div className="input-group">
                        <label htmlFor={`telefone-${fornecedor?._id || 'add'}`} className="required">Telefone</label>
                        <input id={`telefone-${fornecedor?._id || 'add'}`} type="text" name="telefone" defaultValue={fornecedor?.telefone} className={fieldErrors.telefone ? 'input-error' : ''} required />
                        {fieldErrors.telefone && <span className="error-message-text">{fieldErrors.telefone}</span>}
                    </div>
                    <div className="input-group">
                        <label htmlFor={`pessoaContato-${fornecedor?._id || 'add'}`}>Pessoa de Contato</label>
                        <input id={`pessoaContato-${fornecedor?._id || 'add'}`} type="text" name="pessoaContato" defaultValue={fornecedor?.pessoaContato} />
                    </div>
                </div>
                {/* --- Coluna Endereço --- */}
                <div>
                    <h4>Endereço</h4>
                    <div className="input-group">
                        <label htmlFor={`cep-${fornecedor?._id || 'add'}`}>CEP</label>
                        <input id={`cep-${fornecedor?._id || 'add'}`} type="text" name="cep" defaultValue={fornecedor?.endereco?.cep} className={fieldErrors.cep ? 'input-error' : ''} />
                        {fieldErrors.cep && <span className="error-message-text">{fieldErrors.cep}</span>}
                    </div>
                    <div className="input-group">
                        <label htmlFor={`logradouro-${fornecedor?._id || 'add'}`}>Logradouro</label>
                        <input id={`logradouro-${fornecedor?._id || 'add'}`} type="text" name="logradouro" defaultValue={fornecedor?.endereco?.logradouro} />
                    </div>
                    <div className="input-group">
                        <label htmlFor={`numero-${fornecedor?._id || 'add'}`}>Número</label>
                        <input id={`numero-${fornecedor?._id || 'add'}`} type="text" name="numero" defaultValue={fornecedor?.endereco?.numero} />
                    </div>
                    <div className="input-group">
                        <label htmlFor={`complemento-${fornecedor?._id || 'add'}`}>Complemento</label>
                        <input id={`complemento-${fornecedor?._id || 'add'}`} type="text" name="complemento" defaultValue={fornecedor?.endereco?.complemento} />
                    </div>
                    <div className="input-group">
                        <label htmlFor={`bairro-${fornecedor?._id || 'add'}`}>Bairro</label>
                        <input id={`bairro-${fornecedor?._id || 'add'}`} type="text" name="bairro" defaultValue={fornecedor?.endereco?.bairro} />
                    </div>
                    <div className="input-group">
                        <label htmlFor={`cidade-${fornecedor?._id || 'add'}`} className="required">Cidade</label>
                        <input id={`cidade-${fornecedor?._id || 'add'}`} type="text" name="cidade" defaultValue={fornecedor?.endereco?.cidade} className={fieldErrors.cidade ? 'input-error' : ''} required />
                        {fieldErrors.cidade && <span className="error-message-text">{fieldErrors.cidade}</span>}
                    </div>
                    <div className="input-group">
                        <label htmlFor={`estado-${fornecedor?._id || 'add'}`} className="required">Estado</label>
                        <input id={`estado-${fornecedor?._id || 'add'}`} type="text" name="estado" defaultValue={fornecedor?.endereco?.estado} className={fieldErrors.estado ? 'input-error' : ''} required />
                         {fieldErrors.estado && <span className="error-message-text">{fieldErrors.estado}</span>}
                    </div>
                </div>
            </div>
             {/* Mensagem Geral */}
             {formMessage.text && <p className={`form-message ${formMessage.type}`}>{formMessage.text}</p>}
            {/* Ações */}
            <div className="popup-actions">
                <button type="button" onClick={onCancel} className="delete-btn">Cancelar</button>
                <button type="submit" className="add-button">Salvar</button>
            </div>
        </form>
    );
};


// --- Componente Principal FornecedoresView ---
function FornecedoresView() {
    const [fornecedores, setFornecedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalVisible, setAddModalVisible] = useState(false);
    const [isEditModalVisible, setEditModalVisible] = useState(false);
    const [editingFornecedor, setEditingFornecedor] = useState(null);
     // Estado para mensagem geral da view
     const [viewMessage, setViewMessage] = useState('');

    const fetchFornecedores = useCallback(async () => {
        setLoading(true);
        setViewMessage(''); // Limpa mensagem
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            const response = await api.get(`/fornecedores?${params.toString()}`);
            setFornecedores(response.data);
        } catch (err) {
            console.error("Erro ao buscar fornecedores:", err);
            setViewMessage('Erro ao carregar fornecedores.');
        } finally {
            setLoading(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        fetchFornecedores();
    }, [fetchFornecedores]); // Dependência correta

     // Função onSubmit para passar ao FornecedorForm
    const handleFormSubmit = async (id, data) => {
        // A lógica de try/catch será feita dentro do FornecedorForm
        if (id) {
            await api.put(`/fornecedores/${id}`, data);
            setTimeout(() => setEditModalVisible(false), 1500); // Fecha após sucesso
        } else {
            await api.post('/fornecedores', data);
            setTimeout(() => setAddModalVisible(false), 1500); // Fecha após sucesso
        }
        fetchFornecedores(); // Recarrega
    };


    const handleDelete = async (id) => {
        if (window.confirm("Tem a certeza que deseja excluir este fornecedor?")) {
            try {
                await api.delete(`/fornecedores/${id}`);
                fetchFornecedores(); // Recarrega
            } catch (err) {
                alert("Falha ao excluir fornecedor.");
            }
        }
    };

    const openEditModal = (fornecedor) => {
        setEditingFornecedor(fornecedor);
        setEditModalVisible(true);
    };

    const openAddModal = () => {
        setEditingFornecedor(null); // Garante que é adição
        setAddModalVisible(true);
    };

    if (loading && fornecedores.length === 0) return <p>A carregar fornecedores...</p>;

    return (
        <div>
            <div className="view-header"><h2>Fornecedores</h2></div>
            <div className="action-bar">
                <div className="search-box">
                    <input type="text" placeholder="Buscar por Nome, Razão Social ou CNPJ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <button onClick={openAddModal} className="add-button">+ ADD Novo Fornecedor</button>
            </div>

            {viewMessage && <p style={{ color: 'red', textAlign: 'center' }}>{viewMessage}</p>}
            {loading && <p style={{ textAlign: 'center' }}>Atualizando...</p>}

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Nome Fantasia</th><th>CNPJ</th><th>Email</th><th>Telefone</th><th>Cidade</th><th style={{ textAlign: 'right' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                         {fornecedores.length === 0 && !loading ? (
                             <tr><td colSpan="6" style={{ textAlign: 'center' }}>Nenhum fornecedor encontrado.</td></tr>
                         ) : (
                            fornecedores.map(fornecedor => (
                                <tr key={fornecedor._id}>
                                    <td>{fornecedor.nomeFantasia}</td>
                                    <td>{fornecedor.cnpj}</td>
                                    <td>{fornecedor.email}</td>
                                    <td>{fornecedor.telefone}</td>
                                    <td>{fornecedor.endereco?.cidade || '-'}</td>
                                    <td className="actions">
                                        <ActionMenu
                                            onEdit={() => openEditModal(fornecedor)}
                                            onDelete={() => handleDelete(fornecedor._id)}
                                        />
                                    </td>
                                </tr>
                            ))
                         )}
                    </tbody>
                </table>
            </div>

            {/* Modal de Adicionar */}
            <Modal isVisible={isAddModalVisible} onClose={() => setAddModalVisible(false)} title="Adicionar Novo Fornecedor">
                <div className="popup popup-fornecedor">
                    <FornecedorForm fornecedor={null} onSubmit={handleFormSubmit} onCancel={() => setAddModalVisible(false)} />
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