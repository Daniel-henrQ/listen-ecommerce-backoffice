import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import ActionMenu from '../components/ActionMenu';

// --- Componente ClienteForm Refatorado ---
const ClienteForm = ({ cliente, onSubmit, onCancel }) => {
    // --- State para o formulário específico ---
    const [metodosPagamento, setMetodosPagamento] = useState([]);
    const [newCard, setNewCard] = useState({ ultimosDigitos: '', bandeira: '', nomeTitular: '', validade: '' });
    const [fieldErrors, setFieldErrors] = useState({});
    const [formMessage, setFormMessage] = useState({ text: '', type: '' });

    // Limpa os erros e mensagens do formulário
    const clearFormState = () => {
        setFieldErrors({});
        setFormMessage({ text: '', type: '' });
        setNewCard({ ultimosDigitos: '', bandeira: '', nomeTitular: '', validade: '' }); // Resetar campos do novo cartão também
    };

    // Atualizar estado quando o cliente (prop) mudar
    useEffect(() => {
        // Garantir que _id local seja adicionado se não vier da API ou for novo
        const initialMetodos = cliente?.metodosPagamento?.map((mp, index) => ({
            ...mp,
            _id: mp._id || `temp-${Date.now()}-${index}` // ID temporário se não houver
        })) || [];
        setMetodosPagamento(initialMetodos);
        clearFormState(); // Limpa erros ao abrir/trocar cliente
    }, [cliente]);

    const handleNewCardChange = (e) => {
        setNewCard({ ...newCard, [e.target.name]: e.target.value });
         // Limpar erro específico ao digitar
         if (fieldErrors.newCard?.[e.target.name]) {
             setFieldErrors(prev => ({ ...prev, newCard: { ...prev.newCard, [e.target.name]: undefined } }));
         }
    };

    const handleAddMetodoPagamento = () => {
        let cardErrors = {};
        if (!newCard.ultimosDigitos || newCard.ultimosDigitos.length !== 4 || !/^\d+$/.test(newCard.ultimosDigitos)) cardErrors.ultimosDigitos = "Deve ter 4 dígitos.";
        if (!newCard.bandeira.trim()) cardErrors.bandeira = "Obrigatório.";
        if (!newCard.nomeTitular.trim()) cardErrors.nomeTitular = "Obrigatório.";
        if (!newCard.validade.trim() || !/^\d{2}\/\d{2}$/.test(newCard.validade)) cardErrors.validade = "Formato MM/AA.";

        setFieldErrors(prev => ({ ...prev, newCard: cardErrors })); // Atualiza os erros do cartão

        if (Object.keys(cardErrors).length === 0) {
            // Adiciona com um ID temporário único baseado em timestamp e índice
            setMetodosPagamento([...metodosPagamento, { ...newCard, _id: `temp-${Date.now()}-${metodosPagamento.length}` }]);
            setNewCard({ ultimosDigitos: '', bandeira: '', nomeTitular: '', validade: '' }); // Resetar campos
            setFieldErrors(prev => ({ ...prev, newCard: {} })); // Limpar erros do cartão
        }
    };

    const handleRemoveMetodoPagamento = (id) => {
        setMetodosPagamento(metodosPagamento.filter(mp => mp._id !== id));
    };

    const handleFormSubmitInternal = async (e) => {
        e.preventDefault();
        clearFormState(); // Limpar erros antes de submeter
        const formData = new FormData(e.target);
        const formProps = Object.fromEntries(formData.entries());

        let errors = {};
        // Adicionar validações frontend básicas aqui...
        if (!formProps.nome?.trim()) errors.nome = "Nome é obrigatório.";
        if (!formProps.email?.trim() || !/\S+@\S+\.\S+/.test(formProps.email)) errors.email = "Email inválido.";
        if (!cliente && (!formProps.password || formProps.password.length < 6)) { // Exemplo: senha mínima
             errors.password = "Senha deve ter no mínimo 6 caracteres.";
        }
        if (!cliente && formProps.password !== formProps.confirmpassword) {
            errors.password = "As senhas não conferem.";
            errors.confirmpassword = "As senhas não conferem.";
        }
        if (formProps['endereco.cep'] && formProps['endereco.cep'].trim() !== '' && !/^\d{5}-?\d{3}$/.test(formProps['endereco.cep'])) {
             errors['endereco.cep'] = "Formato de CEP inválido (ex: 12345-678).";
        }
        if (formProps.cpf && formProps.cpf.trim() !== '' && !/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(formProps.cpf)) { // Validação simples de formato CPF
            errors.cpf = "Formato de CPF inválido.";
        }
        // ... outras validações

        setFieldErrors(errors);

        if (Object.keys(errors).length > 0) {
            setFormMessage({ text: 'Por favor, corrija os erros no formulário.', type: 'error' });
            return;
        }

        const finalData = {
            nome: formProps.nome,
            sobrenome: formProps.sobrenome,
            email: formProps.email,
            cpf: formProps.cpf,
            telefone: formProps.telefone,
            dataNascimento: formProps.dataNascimento || null, // Enviar null se vazio
            endereco: {
                cep: formProps['endereco.cep'],
                logradouro: formProps['endereco.logradouro'],
                numero: formProps['endereco.numero'],
                complemento: formProps['endereco.complemento'],
                bairro: formProps['endereco.bairro'],
                cidade: formProps['endereco.cidade'],
                estado: formProps['endereco.estado'],
            },
            // Remove o _id temporário antes de enviar para a API
            metodosPagamento: metodosPagamento.map(({ _id, ...rest }) => {
                // Mantém o _id original se ele existir e for um ObjectId válido (string de 24 hex), senão remove
                const isObjectId = typeof _id === 'string' && /^[0-9a-fA-F]{24}$/.test(_id);
                return isObjectId ? { ...rest, _id } : rest;
            }),
            // Incluir senha apenas se for criação
            ...( !cliente && { password: formProps.password, confirmpassword: formProps.confirmpassword } )
        };

        try {
             // Chama a função onSubmit passada pelo componente pai
            await onSubmit(cliente?._id, finalData); // Passa ID (ou null) e os dados processados
            setFormMessage({ text: cliente ? 'Cliente atualizado com sucesso!' : 'Cliente criado com sucesso!', type: 'success' });
             // A lógica de fechar o modal e recarregar dados fica no componente pai
        } catch (err) {
            const apiErrorMessage = err.response?.data?.msg || err.message || `Erro ao salvar cliente.`;
            setFormMessage({ text: apiErrorMessage, type: 'error' });
            // Tentar mapear erros da API para campos
            if (apiErrorMessage.includes('e-mail')) setFieldErrors(prev => ({ ...prev, email: 'Verifique o e-mail.' }));
            if (apiErrorMessage.includes('CPF')) setFieldErrors(prev => ({ ...prev, cpf: 'Verifique o CPF.' }));
        }
    };

    // Função auxiliar para obter valor padrão seguro
    const getDefaultValue = (obj, path, defaultValue = '') => {
        const keys = path.split('.');
        let current = obj;
        for (const key of keys) {
            if (current === null || current === undefined) return defaultValue;
            current = current[key];
        }
        return current === null || current === undefined ? defaultValue : current;
    };


    return (
        // noValidate para controlar validação via JS
        <form onSubmit={handleFormSubmitInternal} className="vertical-form" noValidate>
            <div className="form-grid">
                <div>
                    <h4>Informações Pessoais</h4>
                    <div className="input-group">
                        <label htmlFor={`nome-${cliente?._id || 'add'}`} className="required">Nome</label>
                        <input id={`nome-${cliente?._id || 'add'}`} type="text" name="nome" defaultValue={getDefaultValue(cliente, 'nome')} className={fieldErrors.nome ? 'input-error' : ''} required />
                        {fieldErrors.nome && <span className="error-message-text">{fieldErrors.nome}</span>}
                    </div>
                    <div className="input-group">
                        <label htmlFor={`sobrenome-${cliente?._id || 'add'}`}>Sobrenome</label>
                        <input id={`sobrenome-${cliente?._id || 'add'}`} type="text" name="sobrenome" defaultValue={getDefaultValue(cliente, 'sobrenome')} />
                    </div>
                    <div className="input-group">
                        <label htmlFor={`email-${cliente?._id || 'add'}`} className="required">Email</label>
                        <input id={`email-${cliente?._id || 'add'}`} type="email" name="email" defaultValue={getDefaultValue(cliente, 'email')} className={fieldErrors.email ? 'input-error' : ''} required />
                        {fieldErrors.email && <span className="error-message-text">{fieldErrors.email}</span>}
                    </div>
                    <div className="input-group">
                        <label htmlFor={`cpf-${cliente?._id || 'add'}`}>CPF</label>
                        <input id={`cpf-${cliente?._id || 'add'}`} type="text" name="cpf" defaultValue={getDefaultValue(cliente, 'cpf')} className={fieldErrors.cpf ? 'input-error' : ''} />
                        {fieldErrors.cpf && <span className="error-message-text">{fieldErrors.cpf}</span>}
                    </div>
                    <div className="input-group">
                        <label htmlFor={`telefone-${cliente?._id || 'add'}`}>Telefone</label>
                        <input id={`telefone-${cliente?._id || 'add'}`} type="text" name="telefone" defaultValue={getDefaultValue(cliente, 'telefone')} />
                    </div>
                    <div className="input-group">
                        <label htmlFor={`dataNascimento-${cliente?._id || 'add'}`}>Data de Nascimento</label>
                        <input id={`dataNascimento-${cliente?._id || 'add'}`} type="date" name="dataNascimento" defaultValue={cliente?.dataNascimento ? new Date(cliente.dataNascimento).toISOString().split('T')[0] : ''} />
                    </div>
                </div>
                <div>
                    <h4>Endereço de Entrega</h4>
                    <div className="input-group">
                        <label htmlFor={`cep-${cliente?._id || 'add'}`}>CEP</label>
                        <input id={`cep-${cliente?._id || 'add'}`} type="text" name="endereco.cep" defaultValue={getDefaultValue(cliente, 'endereco.cep')} className={fieldErrors['endereco.cep'] ? 'input-error' : ''} />
                         {fieldErrors['endereco.cep'] && <span className="error-message-text">{fieldErrors['endereco.cep']}</span>}
                    </div>
                     <div className="input-group"><label htmlFor={`logradouro-${cliente?._id || 'add'}`}>Rua</label><input id={`logradouro-${cliente?._id || 'add'}`} type="text" name="endereco.logradouro" defaultValue={getDefaultValue(cliente, 'endereco.logradouro')} /></div>
                     <div className="input-group"><label htmlFor={`numero-${cliente?._id || 'add'}`}>Número</label><input id={`numero-${cliente?._id || 'add'}`} type="text" name="endereco.numero" defaultValue={getDefaultValue(cliente, 'endereco.numero')} /></div>
                     <div className="input-group"><label htmlFor={`complemento-${cliente?._id || 'add'}`}>Complemento</label><input id={`complemento-${cliente?._id || 'add'}`} type="text" name="endereco.complemento" defaultValue={getDefaultValue(cliente, 'endereco.complemento')} /></div>
                     <div className="input-group"><label htmlFor={`bairro-${cliente?._id || 'add'}`}>Bairro</label><input id={`bairro-${cliente?._id || 'add'}`} type="text" name="endereco.bairro" defaultValue={getDefaultValue(cliente, 'endereco.bairro')} /></div>
                     <div className="input-group"><label htmlFor={`cidade-${cliente?._id || 'add'}`}>Cidade</label><input id={`cidade-${cliente?._id || 'add'}`} type="text" name="endereco.cidade" defaultValue={getDefaultValue(cliente, 'endereco.cidade')} /></div>
                     <div className="input-group"><label htmlFor={`estado-${cliente?._id || 'add'}`}>Estado</label><input id={`estado-${cliente?._id || 'add'}`} type="text" name="endereco.estado" defaultValue={getDefaultValue(cliente, 'endereco.estado')} /></div>
                </div>
            </div>

            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid var(--theme-border)' }} />

            {/* --- Métodos de Pagamento --- */}
            <h4>Métodos de Pagamento (Cartões)</h4>
            {metodosPagamento.length > 0 ? (
                metodosPagamento.map((metodo) => (
                    <div key={metodo._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '5px', fontSize: '14px' }}>
                        <span>{metodo.bandeira} final {metodo.ultimosDigitos} ({metodo.validade})</span>
                        <button type="button" onClick={() => handleRemoveMetodoPagamento(metodo._id)} className="delete-btn" style={{ padding: '3px 8px', fontSize: '12px' }}>Remover</button>
                    </div>
                ))
            ) : (
                <p style={{ fontSize: '14px', color: 'var(--theme-text-medium)', marginBottom: '10px' }}>Nenhum cartão cadastrado.</p>
            )}

            {/* --- Adicionar Novo Cartão --- */}
            <div style={{ border: '1px solid var(--theme-border)', borderRadius: '8px', padding: '15px', marginTop: '10px' }}>
                <h5 style={{marginTop: 0, marginBottom: '10px'}}>Adicionar Novo Cartão</h5>
                 <div className="form-grid">
                    <div className="input-group">
                        <label htmlFor={`bandeira-new-${cliente?._id || 'add'}`}>Bandeira</label>
                        <input id={`bandeira-new-${cliente?._id || 'add'}`} value={newCard.bandeira} onChange={handleNewCardChange} type="text" name="bandeira" placeholder="Ex: Visa" className={fieldErrors.newCard?.bandeira ? 'input-error' : ''} />
                         {fieldErrors.newCard?.bandeira && <span className="error-message-text">{fieldErrors.newCard.bandeira}</span>}
                    </div>
                    <div className="input-group">
                        <label htmlFor={`ultimosDigitos-new-${cliente?._id || 'add'}`}>Últimos 4 dígitos</label>
                        <input id={`ultimosDigitos-new-${cliente?._id || 'add'}`} value={newCard.ultimosDigitos} onChange={handleNewCardChange} type="text" name="ultimosDigitos" maxLength="4" placeholder="0000" className={fieldErrors.newCard?.ultimosDigitos ? 'input-error' : ''} />
                         {fieldErrors.newCard?.ultimosDigitos && <span className="error-message-text">{fieldErrors.newCard.ultimosDigitos}</span>}
                    </div>
                    <div className="input-group">
                        <label htmlFor={`nomeTitular-new-${cliente?._id || 'add'}`}>Nome do Titular</label>
                        <input id={`nomeTitular-new-${cliente?._id || 'add'}`} value={newCard.nomeTitular} onChange={handleNewCardChange} type="text" name="nomeTitular" placeholder="Nome como no cartão" className={fieldErrors.newCard?.nomeTitular ? 'input-error' : ''} />
                         {fieldErrors.newCard?.nomeTitular && <span className="error-message-text">{fieldErrors.newCard.nomeTitular}</span>}
                    </div>
                    <div className="input-group">
                        <label htmlFor={`validade-new-${cliente?._id || 'add'}`}>Validade</label>
                        <input id={`validade-new-${cliente?._id || 'add'}`} value={newCard.validade} onChange={handleNewCardChange} type="text" name="validade" placeholder="MM/AA" className={fieldErrors.newCard?.validade ? 'input-error' : ''} />
                         {fieldErrors.newCard?.validade && <span className="error-message-text">{fieldErrors.newCard.validade}</span>}
                    </div>
                 </div>
                <button type="button" onClick={handleAddMetodoPagamento} className="add-button" style={{ width: 'auto', marginTop: '10px', padding: '8px 15px', fontSize: '13px' }}>Adicionar Cartão</button>
            </div>

            {/* --- Senha (apenas na criação) --- */}
            {!cliente && (
                <>
                    <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid var(--theme-border)' }} />
                    <h4>Credenciais de Acesso</h4>
                    <div className="form-grid">
                         <div className="input-group">
                            <label htmlFor="password-add" className="required">Senha</label>
                            <input id="password-add" type="password" name="password" className={fieldErrors.password ? 'input-error' : ''} required />
                            {fieldErrors.password && <span className="error-message-text">{fieldErrors.password}</span>}
                        </div>
                        <div className="input-group">
                            <label htmlFor="confirmpassword-add" className="required">Confirmar Senha</label>
                            <input id="confirmpassword-add" type="password" name="confirmpassword" className={fieldErrors.confirmpassword ? 'input-error' : ''} required />
                             {fieldErrors.confirmpassword && <span className="error-message-text">{fieldErrors.confirmpassword}</span>}
                        </div>
                    </div>
                </>
            )}

             {/* Mensagem Geral do Formulário */}
             {formMessage.text && <p className={`form-message ${formMessage.type}`}>{formMessage.text}</p>}

            {/* Ações do Popup */}
            <div className="popup-actions">
                <button type="button" onClick={onCancel} className="delete-btn">Cancelar</button>
                <button type="submit" className="add-button">Salvar</button>
            </div>
        </form>
    );
};


// --- Componente Principal ClientesView ---
function ClientesView() {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalVisible, setAddModalVisible] = useState(false);
    const [isEditModalVisible, setEditModalVisible] = useState(false);
    const [editingCliente, setEditingCliente] = useState(null);
     // Estado para mensagem geral da view (ex: erro ao buscar)
     const [viewMessage, setViewMessage] = useState('');


    const fetchClientes = useCallback(async () => {
        setLoading(true);
        setViewMessage(''); // Limpa mensagem da view
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            const response = await api.get(`/clientes?${params.toString()}`);
            setClientes(response.data);
        } catch (err) {
            console.error("Erro ao buscar clientes:", err);
            setViewMessage("Erro ao carregar clientes."); // Define mensagem de erro da view
        } finally {
            setLoading(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        fetchClientes();
    }, [fetchClientes]); // fetchClientes agora está memoizado corretamente

     // Função onSubmit para passar ao ClienteForm
    const handleFormSubmit = async (id, data) => {
        // Envolve a chamada da API (que está DENTRO do ClienteForm agora) em try/catch
        // apenas para saber se deve fechar o modal e recarregar
        try {
            if (id) {
                await api.put(`/clientes/${id}`, data);
                 // A mensagem de sucesso é mostrada dentro do ClienteForm
                 setTimeout(() => setEditModalVisible(false), 1500); // Fecha modal após sucesso
            } else {
                await api.post('/clientes', data);
                 setTimeout(() => setAddModalVisible(false), 1500); // Fecha modal após sucesso
            }
            fetchClientes(); // Recarrega a lista
        } catch(err) {
            // O erro já foi tratado e exibido dentro do ClienteForm
            console.error("Erro no submit (ClientesView):", err) // Log adicional se necessário
            // Não precisa fechar o modal em caso de erro
        }
     };

    // Recebe id diretamente do ActionMenu
    const handleDelete = async (id) => {
        if (window.confirm("Tem certeza que deseja excluir este cliente?")) {
            try {
                await api.delete(`/clientes/${id}`);
                fetchClientes(); // Atualiza a lista
            } catch (err) {
                alert("Falha ao excluir cliente.");
            }
        }
    };

    // Recebe id diretamente do ActionMenu
    const openEditModal = (id) => {
        const clienteToEdit = clientes.find(c => c._id === id);
        if (clienteToEdit) {
            setEditingCliente(clienteToEdit);
            setEditModalVisible(true);
        } else {
            console.error("Cliente não encontrado para edição");
            setViewMessage("Erro: Cliente não encontrado para edição.");
        }
    };

    const openAddModal = () => {
        setEditingCliente(null); // Garante que não há dados de edição
        setAddModalVisible(true);
    };

    if (loading && clientes.length === 0) return <p>A carregar clientes...</p>;

    return (
        <div>
            <div className="view-header"><h2>Gestão de Clientes</h2></div>
            <div className="action-bar">
                <div className="search-box">
                    <input type="text" placeholder="Buscar por Nome, Email ou CPF..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <button onClick={openAddModal} className="add-button">+ ADD Novo Cliente</button>
            </div>

             {/* Exibe mensagem de erro da view, se houver */}
             {viewMessage && <p style={{ color: 'red', textAlign: 'center' }}>{viewMessage}</p>}
             {/* Indicador de loading para recarga */}
             {loading && <p style={{ textAlign: 'center' }}>Atualizando...</p>}

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Nome Completo</th><th>Email</th><th>CPF</th><th>Telefone</th><th>Cidade</th><th style={{ textAlign: 'right' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clientes.length === 0 && !loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center' }}>Nenhum cliente encontrado.</td></tr>
                        ) : (
                            clientes.map(cliente => (
                                <tr key={cliente._id}>
                                    <td>{`${cliente.nome} ${cliente.sobrenome || ''}`}</td>
                                    <td>{cliente.email}</td>
                                    <td>{cliente.cpf || '-'}</td>
                                    <td>{cliente.telefone || '-'}</td>
                                    <td>{cliente.endereco?.cidade || '-'}</td>
                                    <td className="actions">
                                        <ActionMenu
                                            itemId={cliente._id} // Passa o ID
                                            onEdit={openEditModal} // Função recebe ID
                                            onDelete={handleDelete} // Função recebe ID
                                        />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Adicionar */}
            <Modal isVisible={isAddModalVisible} onClose={() => setAddModalVisible(false)} title="Adicionar Novo Cliente">
                {/* Usar a classe específica para estilo se necessário, ou só a genérica */}
                <div className="popup popup-cliente">
                    {/* Passa null como cliente e as funções onSubmit/onCancel */}
                    <ClienteForm cliente={null} onSubmit={handleFormSubmit} onCancel={() => setAddModalVisible(false)} />
                </div>
            </Modal>

            {/* Modal Editar */}
            {/* Renderiza o Modal SOMENTE se editingCliente não for null */}
            {editingCliente && (
                <Modal isVisible={isEditModalVisible} onClose={() => setEditModalVisible(false)} title="Editar Cliente">
                    <div className="popup popup-cliente">
                         {/* Passa o cliente sendo editado e as funções onSubmit/onCancel */}
                        <ClienteForm cliente={editingCliente} onSubmit={handleFormSubmit} onCancel={() => setEditModalVisible(false)} />
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default ClientesView;