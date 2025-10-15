const Fornecedor = require('../models/fornecedorModel');

// Criar um novo fornecedor
exports.criarFornecedor = async (req, res) => {
    try {
        const novoFornecedor = new Fornecedor(req.body);
        await novoFornecedor.save();
        res.status(201).json({ msg: "Fornecedor criado com sucesso!", fornecedor: novoFornecedor });
    } catch (error) {
        if (error.code === 11000) { // Erro de duplicidade do Mongoose
            return res.status(422).json({ msg: `Erro: O valor '${error.keyValue[Object.keys(error.keyValue)[0]]}' já está em uso.` });
        }
        res.status(500).json({ msg: "Ocorreu um erro no servidor.", error: error.message });
    }
};

// Listar todos os fornecedores com filtro de busca
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

        const fornecedores = await Fornecedor.find(filtro);
        res.json(fornecedores);
    } catch (error) {
        res.status(500).json({ msg: "Erro ao buscar fornecedores." });
    }
};

// Atualizar um fornecedor
exports.atualizarFornecedor = async (req, res) => {
    try {
        const fornecedorAtualizado = await Fornecedor.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!fornecedorAtualizado) {
            return res.status(404).json({ msg: "Fornecedor não encontrado." });
        }
        res.json({ msg: "Fornecedor atualizado com sucesso!", fornecedor: fornecedorAtualizado });
    } catch (error) {
        res.status(500).json({ msg: "Ocorreu um erro no servidor.", error: error.message });
    }
};

// Deletar um fornecedor
exports.deletarFornecedor = async (req, res) => {
    try {
        const fornecedorDeletado = await Fornecedor.findByIdAndDelete(req.params.id);

        if (!fornecedorDeletado) {
            return res.status(404).json({ msg: "Fornecedor não encontrado." });
        }
        res.json({ msg: "Fornecedor deletado com sucesso." });
    } catch (error) {
        res.status(500).json({ msg: "Ocorreu um erro no servidor." });
    }
};