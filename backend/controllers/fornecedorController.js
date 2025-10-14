const Fornecedor = require('../models/fornecedorModel');

// Criar novo fornecedor
exports.criarFornecedor = async (req, res) => {
    try {
        const { cnpj, razaoSocial } = req.body;
        const fornecedorExistente = await Fornecedor.findOne({ $or: [{ cnpj }, { razaoSocial }] });
        if (fornecedorExistente) {
            return res.status(422).json({ msg: "CNPJ ou Razão Social já cadastrado." });
        }
        const fornecedor = new Fornecedor(req.body);
        await fornecedor.save();
        res.status(201).json(fornecedor);
    } catch (error) {
        res.status(500).json({ msg: "Ocorreu um erro no servidor.", error: error.message });
    }
};

// Listar todos os fornecedores (com busca)
exports.listarFornecedores = async (req, res) => {
    try {
        const { search } = req.query;
        const filtro = {};

        if (search) {
            filtro.$or = [
                { nomeFantasia: { $regex: search, $options: 'i' } },
                { razaoSocial: { $regex: search, $options: 'i' } },
                { cnpj: { $regex: search, $options: 'i' } }
            ];
        }
        const fornecedores = await Fornecedor.find(filtro).sort({ nomeFantasia: 1 });
        res.json(fornecedores);
    } catch (error) {
        res.status(500).json({ msg: "Erro ao buscar fornecedores." });
    }
};

// Atualizar um fornecedor
exports.atualizarFornecedor = async (req, res) => {
    try {
        const fornecedorAtualizado = await Fornecedor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!fornecedorAtualizado) {
            return res.status(404).json({ msg: "Fornecedor não encontrado." });
        }
        res.json(fornecedorAtualizado);
    } catch (error) {
        res.status(500).json({ msg: "Ocorreu um erro no servidor.", error: error.message });
    }
};

// Deletar um fornecedor
exports.deletarFornecedor = async (req, res) => {
    try {
        const fornecedor = await Fornecedor.findByIdAndDelete(req.params.id);
        if (!fornecedor) {
            return res.status(404).json({ msg: "Fornecedor não encontrado." });
        }
        res.json({ message: "Fornecedor deletado com sucesso." });
    } catch (error) {
        res.status(500).json({ msg: "Ocorreu um erro no servidor." });
    }
};