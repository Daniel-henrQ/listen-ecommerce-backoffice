const User = require("../models/usuarioModel");
const bcrypt = require("bcrypt");
///////teste////////
// Função para um admin criar um novo usuário
const createUser = async (req, res) => {
    const { name, email, password, confirmpassword, cpf, role } = req.body;

    if (!name || !email || !password || !cpf || !role) {
        return res.status(422).json({ msg: "Todos os campos são obrigatórios!" });
    }
    if (password !== confirmpassword) {
        return res.status(422).json({ msg: "As senhas não conferem!" });
    }
    const userExists = await User.findOne({ email: email });
    if (userExists) {
        return res.status(422).json({ msg: "Este e-mail já está em uso!" });
    }
    
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    const user = new User({ name, email, password: passwordHash, cpf, role });

    try {
        await user.save();
        res.status(201).json({ msg: "Usuário criado com sucesso!" });
    } catch (error) {
        res.status(500).json({ msg: "Aconteceu um erro no servidor." });
    }
};

// Função para listar todos os usuários (COM FILTRO)
const getAllUsers = async (req, res) => {
    try {
        const filtro = {};
        const { search } = req.query; // Recebe um parâmetro 'search'

        if (search) {
            // Cria uma busca 'OU' ($or) para procurar em nome e email
            filtro.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(filtro, '-password');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ msg: "Erro ao buscar usuários." });
    }
};

// Função para atualizar um usuário
const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { name, email, cpf, role } = req.body;

        if (!name || !email || !cpf || !role) {
            return res.status(422).json({ msg: "Todos os campos são obrigatórios!" });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { name, email, cpf, role },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ msg: "Usuário não encontrado." });
        }
        res.status(200).json({ msg: "Usuário atualizado com sucesso!", user: updatedUser });
    } catch (error) {
        res.status(500).json({ msg: "Aconteceu um erro no servidor." });
    }
};

// Função para deletar um usuário
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ msg: "Usuário não encontrado." });
        }
        res.status(200).json({ msg: "Usuário deletado com sucesso!" });
    } catch (error) {
        res.status(500).json({ msg: "Aconteceu um erro no servidor." });
    }
};

module.exports = {
    createUser,
    getAllUsers,
    updateUser,
    deleteUser
};