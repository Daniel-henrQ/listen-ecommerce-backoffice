const Fornecedor = require('../models/fornecedorModel');
// 1. Importar o serviço de notificação
const { notificacaoService } = require('./notificacaoService');

// Criar um novo fornecedor
exports.criarFornecedor = async (req, res) => {
    try {
        const novoFornecedor = new Fornecedor(req.body);
        await novoFornecedor.save();

        // --- NOTIFICAÇÃO ---
        try {
            await notificacaoService.notificarFornecedor('create', novoFornecedor.nomeFantasia, novoFornecedor._id); //
        } catch (notifError) {
            console.error("Erro ao criar notificação de fornecedor (create):", notifError);
            // Não impede a resposta principal, apenas regista o erro
        }
        // --- FIM NOTIFICAÇÃO ---

        res.status(201).json({ msg: "Fornecedor criado com sucesso!", fornecedor: novoFornecedor });
    } catch (error) {
        if (error.code === 11000) { // Erro de duplicidade do Mongoose
            return res.status(422).json({ msg: `Erro: O valor '${error.keyValue[Object.keys(error.keyValue)[0]]}' já está em uso.` }); //
        }
        console.error("Erro ao criar fornecedor:", error); // Log detalhado
        res.status(500).json({ msg: "Ocorreu um erro no servidor ao criar o fornecedor.", error: error.message }); //
    }
};

// Listar todos os fornecedores com filtro de busca
exports.listarFornecedores = async (req, res) => {
    try {
        const { search } = req.query;
        const filtro = {};

        if (search) {
            filtro.$or = [
                { nomeFantasia: { $regex: search, $options: 'i' } }, //
                { razaoSocial: { $regex: search, $options: 'i' } }, //
                { cnpj: { $regex: search, $options: 'i' } } //
            ];
        }

        const fornecedores = await Fornecedor.find(filtro);
        res.json(fornecedores); //
    } catch (error) {
        console.error("Erro ao listar fornecedores:", error); // Log detalhado
        res.status(500).json({ msg: "Erro ao buscar fornecedores." }); //
    }
};

// Atualizar um fornecedor
exports.atualizarFornecedor = async (req, res) => {
    try {
        const fornecedorAtualizado = await Fornecedor.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true } // runValidators é importante aqui //
        );

        if (!fornecedorAtualizado) {
            return res.status(404).json({ msg: "Fornecedor não encontrado." }); //
        }

        // --- NOTIFICAÇÃO ---
        try {
            await notificacaoService.notificarFornecedor('update', fornecedorAtualizado.nomeFantasia, fornecedorAtualizado._id); //
        } catch (notifError) {
            console.error("Erro ao criar notificação de fornecedor (update):", notifError);
        }
        // --- FIM NOTIFICAÇÃO ---

        res.json({ msg: "Fornecedor atualizado com sucesso!", fornecedor: fornecedorAtualizado }); //
    } catch (error) {
         if (error.code === 11000) { // Trata duplicidade no update
             const field = Object.keys(error.keyValue)[0];
             const value = error.keyValue[field];
             return res.status(422).json({ msg: `Erro: O campo '${field}' com valor '${value}' já está em uso.` }); //
         }
         // Trata erros de validação do Mongoose
         if (error.name === 'ValidationError') {
             const messages = Object.values(error.errors).map(val => val.message);
             return res.status(400).json({ msg: `Erro de validação: ${messages.join(', ')}` });
         }
        console.error("Erro ao atualizar fornecedor:", error); // Log detalhado
        res.status(500).json({ msg: "Ocorreu um erro no servidor ao atualizar o fornecedor.", error: error.message }); //
    }
};

// Deletar um fornecedor
exports.deletarFornecedor = async (req, res) => {
    try {
        const fornecedorDeletado = await Fornecedor.findByIdAndDelete(req.params.id); //

        if (!fornecedorDeletado) {
            return res.status(404).json({ msg: "Fornecedor não encontrado." }); //
        }

        // --- NOTIFICAÇÃO ---
        try {
            // Usamos os dados do fornecedor *antes* de ser deletado
            await notificacaoService.notificarFornecedor('delete', fornecedorDeletado.nomeFantasia, fornecedorDeletado._id); //
        } catch (notifError) {
            console.error("Erro ao criar notificação de fornecedor (delete):", notifError);
        }
        // --- FIM NOTIFICAÇÃO ---

        res.json({ msg: "Fornecedor deletado com sucesso." }); //
    } catch (error) {
        console.error("Erro ao deletar fornecedor:", error); // Log detalhado
        res.status(500).json({ msg: "Ocorreu um erro no servidor ao deletar o fornecedor." }); //
    }
};