// backend/controllers/clienteController.js
const Cliente = require('../models/clienteModel');

// Criar um novo cliente
exports.criarCliente = async (req, res) => {
    const { email, cpf } = req.body;
    try {
        if (await Cliente.findOne({ email })) {
            return res.status(422).json({ msg: "Este e-mail já está em uso." });
        }
        if (cpf && await Cliente.findOne({ cpf })) {
            return res.status(422).json({ msg: "Este CPF já está cadastrado." });
        }
        const novoCliente = new Cliente(req.body);
        await novoCliente.save();
        res.status(201).json({ msg: "Cliente criado com sucesso!", cliente: novoCliente });
    } catch (error) {
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