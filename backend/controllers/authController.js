// backend/controllers/authController.js
const User = require("../models/usuarioModel");
const Cliente = require("../models/clienteModel"); // Importar o modelo Cliente
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// A função registerUser permanece igual (registra apenas funcionários aqui)
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

  // Criação do novo usuário (funcionário)
  const newUser = new User({
    name,
    email,
    cpf,
    role: role || 'vendas', // Default 'vendas' se não especificado
    password: passwordHash,
  });

  try {
    await newUser.save();
    res.status(201).json({ msg: "Usuário (funcionário) criado com sucesso!" });
  } catch (error) {
    console.error("Erro ao salvar usuário:", error);
    res.status(500).json({ msg: "Aconteceu um erro no servidor.", error: error.message });
  }
};

// Lógica de Login de Usuário (ATUALIZADA para verificar Clientes também)
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(422).json({ msg: "Email e senha são obrigatórios!" });
    }

    try {
        let user = null;
        let userType = null; // Para armazenar se é 'employee' ou 'customer'
        let role = null; // Para armazenar o papel (adm, vendas, cliente)

        // 1. Tenta encontrar na coleção User (funcionários)
        const employee = await User.findOne({ email: email }).select('+password');

        if (employee) {
            const checkPassword = await bcrypt.compare(password, employee.password);
            if (checkPassword) {
                user = employee;
                userType = 'employee';
                role = employee.role; // Pega o papel do funcionário ('adm' ou 'vendas')
            }
        }

        // 2. Se não encontrou ou a senha não bateu, tenta na coleção Cliente
        if (!user) {
            const customer = await Cliente.findOne({ email: email }).select('+password');
            if (customer) {
                const checkPassword = await bcrypt.compare(password, customer.password);
                if (checkPassword) {
                    user = customer;
                    userType = 'customer';
                    role = 'cliente'; // Atribui um papel genérico 'cliente'
                }
            }
        }

        // 3. Verifica se encontrou um utilizador e se a senha correspondeu em alguma coleção
        if (!user) {
            // Mensagem genérica para segurança (não indica se o email existe)
            return res.status(404).json({ msg: "Usuário não encontrado ou senha inválida!" });
        }

        // 4. Gera o JWT
        const secret = process.env.SECRET;
        if (!secret) {
            console.error("Erro: Variável de ambiente SECRET não definida para JWT.");
            return res.status(500).json({ msg: "Erro de configuração no servidor." });
        }

        const token = jwt.sign(
            {
                id: user._id,
                name: user.name || user.nome, // Usa 'name' para funcionário, 'nome' para cliente
                // Inclui o papel determinado no token
                role: role
            },
            secret,
            { expiresIn: '1h' } // Adiciona expiração ao token (opcional, mas recomendado)
        );

        res.status(200).json({
            msg: "Autenticação realizada com sucesso!",
            token,
            // Opcionalmente, retorna informações do utilizador (sem a senha)
            user: {
                id: user._id,
                name: user.name || user.nome,
                email: user.email,
                role: role // Retorna o papel (adm, vendas, cliente)
            }
        });

    } catch (error) {
        console.error("Erro ao fazer login:", error);
        res.status(500).json({ msg: "Ocorreu um erro interno no servidor." });
    }
};

module.exports = { registerUser, loginUser };