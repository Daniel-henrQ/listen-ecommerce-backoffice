import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import ActionMenu from '../components/ActionMenu';

const ClienteForm = ({ cliente, onSubmit, onCancel }) => {
    const [metodosPagamento, setMetodosPagamento] = useState(cliente?.metodosPagamento || []);

    const [ultimosDigitos, setUltimosDigitos] = useState('');
    const [bandeira, setBandeira] = useState('');
    const [nomeTitular, setNomeTitular] = useState('');
    const [validade, setValidade] = useState('');

    const handleAddMetodoPagamento = () => {
        if (!ultimosDigitos || !bandeira || !nomeTitular || !validade) {
            alert("Preencha todos os campos do cartão.");
            return;
        }
        setMetodosPagamento([...metodosPagamento, { ultimosDigitos, bandeira, nomeTitular, validade, _id: Date.now() }]);
        setUltimosDigitos(''); setBandeira(''); setNomeTitular(''); setValidade('');
    };

    const handleRemoveMetodoPagamento = (id) => {
        setMetodosPagamento(metodosPagamento.filter(mp => mp._id !== id));
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const formProps = Object.fromEntries(formData.entries());

        const finalData = {
            nome: formProps.nome,
            sobrenome: formProps.sobrenome,
            email: formProps.email,
            cpf: formProps.cpf,
            telefone: formProps.telefone,
            dataNascimento: formProps.dataNascimento,
            endereco: {
                cep: formProps['endereco.cep'],
                logradouro: formProps['endereco.logradouro'],
                numero: formProps['endereco.numero'],
                complemento: formProps['endereco.complemento'],
                bairro: formProps['endereco.bairro'],
                cidade: formProps['endereco.cidade'],
                estado: formProps['endereco.estado'],
            },
            metodosPagamento,
            password: formProps.password,
            confirmpassword: formProps.confirmpassword,
        };

        onSubmit(e, cliente?._id, finalData);
    };

    return (
        <form onSubmit={handleFormSubmit} className="vertical-form">
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

            <hr style={{ margin: '20px 0', border: '1px solid #eee' }} />

            <h4>Métodos de Pagamento (Opcional)</h4>
            {metodosPagamento.map((metodo) => (
                <div key={metodo._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '5px' }}>
                    <span>{metodo.bandeira} final {metodo.ultimosDigitos}</span>
                    <button type="button" onClick={() => handleRemoveMetodoPagamento(metodo._id)} className="delete-btn" style={{ padding: '5px 10px' }}>Remover</button>
                </div>
            ))}
            <div style={{ border: '1px solid var(--theme-border)', borderRadius: '8px', padding: '15px', marginTop: '10px' }}>
                <div className="input-group"><label>Bandeira</label><input value={bandeira} onChange={e => setBandeira(e.target.value)} type="text" placeholder="Ex: Visa" /></div>
                <div className="input-group"><label>Últimos 4 dígitos</label><input value={ultimosDigitos} onChange={e => setUltimosDigitos(e.target.value)} type="text" maxLength="4" /></div>
                <div className="input-group"><label>Nome do Titular</label><input value={nomeTitular} onChange={e => setNomeTitular(e.target.value)} type="text" /></div>
                <div className="input-group"><label>Validade</label><input value={validade} onChange={e => setValidade(e.target.value)} type="text" placeholder="MM/AA" /></div>
                <button type="button" onClick={handleAddMetodoPagamento} className="add-button" style={{ width: '100%', marginTop: '10px' }}>Adicionar Cartão</button>
            </div>


            {!cliente && (
                <>
                    <hr style={{ margin: '20px 0', border: '1px solid #eee' }} />
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
};


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
        } finally {
            setLoading(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        fetchClientes();
    }, [fetchClientes]);

    const handleFormSubmit = async (e, id, data) => {
        if (!id && data.password !== data.confirmpassword) {
            alert("As senhas não conferem!");
            return;
        }

        try {
            if (id) {
                await api.put(`/clientes/${id}`, data);
                setEditModalVisible(false);
            } else {
                await api.post('/clientes', data);
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
                                <td className="actions" style={{ textAlign: 'right' }}>
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