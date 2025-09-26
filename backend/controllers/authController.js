const User = require("../models/usuarioModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// A função registerUser permanece igual
const registerUser = async (req, res) => {
  const { name, email, password, confirmpassword, cpf, role } = req.body;

  // Validações 
  if (!name || !email || !password || !cpf) { 
    return res.status(422).json({ msg: "Todos os campos são obrigatórios, incluindo o CPF!" });
  }
  if (password !== confirmpassword) {
    return res.status(422).json({ msg: "As senhas não conferem!" });
  }

  // Verificação de Duplicidade
  const userExists = await User.findOne({ email: email });
  if (userExists) {
    return res.status(422).json({ msg: "Este e-mail já está em uso!" });
  }
  
  if (cpf) {
    const cpfExists = await User.findOne({ cpf: cpf });
    if (cpfExists) {
      return res.status(422).json({ msg: "Este CPF já está cadastrado!" });
    }
  }


  // Criação da Senha
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  // Criação do novo usuário
  const newUser = new User({
    name,
    email,
    cpf,
    role: role || 'vendas', 
    password: passwordHash,
  });

  try {
    await newUser.save();
    res.status(201).json({ msg: "Usuário criado com sucesso!" });
  } catch (error) {
    console.error("Erro ao salvar usuário:", error);
    res.status(500).json({ msg: "Aconteceu um erro no servidor.", error: error.message });
  }
};

// Lógica de Login de Usuário (COM A CORREÇÃO)
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(422).json({ msg: "Email e senha são obrigatórios!" });
  }

  // CORREÇÃO: Adicionado .select('+password') para garantir que a senha seja retornada
  const user = await User.findOne({ email: email }).select('+password');
  
  if (!user) {
    return res.status(404).json({ msg: "Usuário não encontrado!" });
  }

  const checkPassword = await bcrypt.compare(password, user.password);
  if (!checkPassword) {
    return res.status(422).json({ msg: "Senha inválida" });
  }

  try {
    const secret = process.env.SECRET;
    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
        role: user.role
      },
      secret
    );
    res.status(200).json({ msg: "Autenticação realizada com sucesso!", token });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    res.status(500).json({ msg: "Ocorreu um erro interno no servidor." });
  }
};

module.exports = { registerUser, loginUser };