// backend/controllers/clienteController.js
const Cliente = require('../models/clienteModel');
const bcrypt = require('bcrypt'); // Importar bcrypt

exports.criarCliente = async (req, res) => {
    // Adicione nome aos campos esperados se 'username' for usado como 'nome'
    const { email, cpf, nome, password, confirmpassword /* outros campos... */ } = req.body;

    // ... (suas validações existentes para email, cpf, nome, etc.) ...

    // Validação de senha (exemplo mínimo)
    if (!password) {
        return res.status(422).json({ msg: "A senha é obrigatória." });
    }
     if (password !== confirmpassword) { // Adicionado if confirmpassword existe
        return res.status(422).json({ msg: "As senhas não conferem." });
     }


    try {
        if (await Cliente.findOne({ email })) {
            return res.status(422).json({ msg: "Este e-mail já está em uso." });
        }
        if (cpf && await Cliente.findOne({ cpf })) {
            return res.status(422).json({ msg: "Este CPF já está cadastrado." });
        }

        // --- HASHING DA SENHA ---
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);
        // -------------------------

        // Cria o cliente usando os dados e a senha hasheada
        const novoCliente = new Cliente({
            email,
            nome, // Certifique-se de que o campo 'nome' está sendo enviado
            cpf,
            password: passwordHash, // Salva a senha hasheada
            // ... (restante dos campos como telefone, endereco, etc., se enviados)
        });

        await novoCliente.save();
        // Não retorne a senha, mesmo hasheada
         const clienteParaRetorno = novoCliente.toObject();
         delete clienteParaRetorno.password;

        res.status(201).json({ msg: "Cliente criado com sucesso!", cliente: clienteParaRetorno });
    } catch (error) {
        console.error("Erro ao criar cliente:", error); // Log do erro
        res.status(500).json({ msg: "Ocorreu um erro no servidor.", error: error.message });
    }
};

// Listar todos os clientes com filtro de busca
exports.listarClientes = async (req, res) => {
    try {
        const { search } = req.query;
        const filtro = {};
        if (search) {
            filtro.$or = [
                { nome: { $regex: search, $options: 'i' } },
                { sobrenome: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { cpf: { $regex: search, $options: 'i' } }
            ];
        }
        const clientes = await Cliente.find(filtro);
        res.json(clientes);
    } catch (error) {
        res.status(500).json({ msg: "Erro ao buscar clientes." });
    }
};

// Obter um cliente por ID
exports.obterClientePorId = async (req, res) => {
    try {
        const cliente = await Cliente.findById(req.params.id);
        if (!cliente) {
            return res.status(404).json({ msg: "Cliente não encontrado." });
        }
        res.json(cliente);
    } catch (error) {
        res.status(500).json({ msg: "Erro no servidor." });
    }
};


// Atualizar um cliente
exports.atualizarCliente = async (req, res) => {
    try {
        // Remove o campo de senha do body para não ser atualizado indevidamente
        delete req.body.password;
        
        const clienteAtualizado = await Cliente.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!clienteAtualizado) {
            return res.status(404).json({ msg: "Cliente não encontrado." });
        }
        res.json({ msg: "Cliente atualizado com sucesso!", cliente: clienteAtualizado });
    } catch (error) {
        res.status(500).json({ msg: "Ocorreu um erro no servidor.", error: error.message });
    }
};

// Deletar um cliente
exports.deletarCliente = async (req, res) => {
    try {
        const clienteDeletado = await Cliente.findByIdAndDelete(req.params.id);
        if (!clienteDeletado) {
            return res.status(404).json({ msg: "Cliente não encontrado." });
        }
        res.json({ msg: "Cliente deletado com sucesso." });
    } catch (error) {
        res.status(500).json({ msg: "Ocorreu um erro no servidor." });
    }
};