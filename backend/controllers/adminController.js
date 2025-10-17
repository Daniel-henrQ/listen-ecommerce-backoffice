const User = require("../models/usuarioModel");
const bcrypt = require("bcrypt");
const { notificacaoService } = require('./notificacaoService'); // Importar o serviço

// Função para um admin criar um novo usuário (vendedor ou outro admin)
const createUser = async (req, res) => {
    const { name, email, password, confirmpassword, cpf, role } = req.body;

    // Validações
    if (!name || !email || !password || !cpf || !role) {
        return res.status(422).json({ msg: "Todos os campos (Nome, Email, Senha, CPF, Função) são obrigatórios!" });
    }
    if (password !== confirmpassword) {
        return res.status(422).json({ msg: "As senhas não conferem!" });
    }
    // Validar se o role é permitido
    const allowedRoles = User.schema.path('role').enumValues;
    if (!allowedRoles.includes(role)) {
        return res.status(422).json({ msg: `Função inválida. Permitidas: ${allowedRoles.join(', ')}` });
    }

    // Verifica duplicidade de email e CPF
    const userExists = await User.findOne({ email: email });
    if (userExists) {
        return res.status(422).json({ msg: "Este e-mail já está em uso!" });
    }
    const cpfExists = await User.findOne({ cpf: cpf });
     if (cpfExists) {
         return res.status(422).json({ msg: "Este CPF já está cadastrado!" });
     }


    // Hash da senha
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Criação do novo usuário
    const user = new User({
         name,
         email,
         password: passwordHash,
         cpf,
         role // Role definido pelo admin
    });

    try {
        await user.save();

        // --- NOTIFICAÇÃO (Apenas para Admins) ---
        try {
            await notificacaoService.notificarAdminUser('create', user.name, user._id);
        } catch (notifError) { console.error("Erro notificação criar usuário:", notifError); }
        // --- FIM NOTIFICAÇÃO ---

        // Não retorna a senha ou outros dados sensíveis
        res.status(201).json({ msg: "Usuário criado com sucesso!" });
    } catch (error) {
         // Trata erros de validação do Mongoose
         if (error.name === 'ValidationError') {
             const messages = Object.values(error.errors).map(val => val.message);
             return res.status(400).json({ msg: `Erro de validação: ${messages.join(', ')}` });
         }
        console.error("Erro ao salvar usuário (admin):", error);
        res.status(500).json({ msg: "Aconteceu um erro no servidor ao criar o usuário." });
    }
};

// Função para listar todos os usuários (COM FILTRO por nome ou email)
const getAllUsers = async (req, res) => {
    try {
        const filtro = {};
        const { search } = req.query; // Recebe um parâmetro 'search'

        if (search) {
             const regex = new RegExp(search, 'i'); // Case-insensitive
            // Cria uma busca 'OU' ($or) para procurar em nome e email
            filtro.$or = [
                { name: regex },
                { email: regex }
                // Poderia adicionar CPF se necessário: { cpf: regex }
            ];
        }

        // Busca usuários, excluindo o campo password (-password)
        const users = await User.find(filtro, '-password');
        res.status(200).json(users);
    } catch (error) {
        console.error("Erro ao buscar usuários (admin):", error);
        res.status(500).json({ msg: "Erro ao buscar usuários." });
    }
};

// Função para atualizar um usuário (NÃO atualiza senha aqui)
const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { name, email, cpf, role } = req.body; // Pega os dados permitidos para update

        // Validações
        if (!name || !email || !cpf || !role) {
            return res.status(422).json({ msg: "Todos os campos (Nome, Email, CPF, Função) são obrigatórios!" });
        }
         // Validar se o role é permitido
         const allowedRoles = User.schema.path('role').enumValues;
         if (!allowedRoles.includes(role)) {
             return res.status(422).json({ msg: `Função inválida. Permitidas: ${allowedRoles.join(', ')}` });
         }

        // Encontra e atualiza o usuário, retornando o documento novo e sem a senha
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            // Atualiza apenas os campos permitidos
            { name, email, cpf, role },
            // Opções: retorna o documento atualizado, roda validadores do schema
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ msg: "Usuário não encontrado." });
        }

        // --- NOTIFICAÇÃO (Apenas para Admins) ---
        try {
            await notificacaoService.notificarAdminUser('update', updatedUser.name, updatedUser._id);
        } catch (notifError) { console.error("Erro notificação atualizar usuário:", notifError); }
        // --- FIM NOTIFICAÇÃO ---

        res.status(200).json({ msg: "Usuário atualizado com sucesso!", user: updatedUser });
    } catch (error) {
         if (error.code === 11000) { // Trata duplicidade de email/cpf no update
             const field = Object.keys(error.keyValue)[0];
             const value = error.keyValue[field];
             return res.status(422).json({ msg: `Erro: O campo '${field}' com valor '${value}' já está em uso por outro usuário.` });
         }
         // Trata erros de validação do Mongoose
         if (error.name === 'ValidationError') {
             const messages = Object.values(error.errors).map(val => val.message);
             return res.status(400).json({ msg: `Erro de validação: ${messages.join(', ')}` });
         }
        console.error("Erro ao atualizar usuário (admin):", error);
        res.status(500).json({ msg: "Aconteceu um erro no servidor ao atualizar o usuário." });
    }
};

// Função para deletar um usuário
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

         // Opcional: Impedir que o admin se auto-delete?
         // if (req.user.id === userId) {
         //    return res.status(400).json({ msg: "Não é possível excluir a si mesmo." });
         // }

        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ msg: "Usuário não encontrado." });
        }

        // --- NOTIFICAÇÃO (Apenas para Admins) ---
         try {
             await notificacaoService.notificarAdminUser('delete', deletedUser.name, deletedUser._id);
         } catch (notifError) { console.error("Erro notificação deletar usuário:", notifError); }
        // --- FIM NOTIFICAÇÃO ---

        res.status(200).json({ msg: "Usuário deletado com sucesso!" });
    } catch (error) {
        console.error("Erro ao deletar usuário (admin):", error);
        res.status(500).json({ msg: "Aconteceu um erro no servidor ao deletar o usuário." });
    }
};

module.exports = {
    createUser,
    getAllUsers,
    updateUser,
    deleteUser
};