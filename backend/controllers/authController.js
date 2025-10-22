// backend/controllers/authController.js
const User = require("../models/usuarioModel");
const Cliente = require("../models/clienteModel"); // Importar o modelo Cliente
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// A função registerUser permanece igual (registra apenas funcionários aqui, provavelmente pelo backoffice)
const registerUser = async (req, res) => {
    const { name, email, password, confirmpassword, cpf, role } = req.body;

    // Validações
    if (!name || !email || !password || !cpf) {
        return res.status(422).json({ msg: "Todos os campos são obrigatórios, incluindo o CPF!" });
    }
    if (password !== confirmpassword) {
        return res.status(422).json({ msg: "As senhas não conferem!" });
    }
     if (password.length < 6) { // Exemplo de validação mínima de senha
        return res.status(422).json({ msg: "A senha deve ter no mínimo 6 caracteres." });
    }


    // Verificação de Duplicidade (Funcionário)
    const userExists = await User.findOne({ email: email });
    if (userExists) {
        return res.status(422).json({ msg: "Este e-mail já está em uso por outro funcionário!" });
    }
    const cpfExists = await User.findOne({ cpf: cpf });
    if (cpfExists) {
        return res.status(422).json({ msg: "Este CPF já está cadastrado para outro funcionário!" });
    }


    // Criação da Senha Hash
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Criação do novo usuário (funcionário)
    const newUser = new User({
        name,
        email,
        cpf,
        // Garante que apenas 'adm' ou 'vendas' sejam aceites, ou usa 'vendas' como padrão
        role: ['adm', 'vendas'].includes(role) ? role : 'vendas',
        password: passwordHash,
    });

    try {
        await newUser.save();
        res.status(201).json({ msg: "Usuário (funcionário) criado com sucesso!" });
    } catch (error) {
        console.error("Erro ao salvar funcionário:", error);
        // Trata erros de validação do Mongoose especificamente
        if (error.name === 'ValidationError') {
             const messages = Object.values(error.errors).map(val => val.message);
             return res.status(400).json({ msg: `Erro de validação: ${messages.join(', ')}` });
        }
        res.status(500).json({ msg: "Aconteceu um erro no servidor ao criar o funcionário.", error: error.message });
    }
};

// Lógica de Login de Usuário (UNIFICADA - Verifica Funcionários e Clientes)
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    // Validação básica de entrada
    if (!email || !password) {
        return res.status(422).json({ msg: "Email e senha são obrigatórios!" });
    }

    try {
        let user = null; // Armazenará o usuário encontrado (funcionário ou cliente)
        let role = null; // Armazenará o papel ('adm', 'vendas', ou 'cliente')

        // 1. Tenta encontrar na coleção User (funcionários)
        // Seleciona explicitamente a senha (+password) para comparação
        const employee = await User.findOne({ email: email }).select('+password');

        if (employee) {
            // Compara a senha fornecida com o hash armazenado
            const checkPassword = await bcrypt.compare(password, employee.password);
            if (checkPassword) {
                user = employee;
                role = employee.role; // Papel do funcionário ('adm' ou 'vendas')
            }
        }

        // 2. Se não encontrou funcionário ou a senha estava incorreta, tenta na coleção Cliente
        if (!user) {
            // Seleciona explicitamente a senha (+password) para comparação
            const customer = await Cliente.findOne({ email: email }).select('+password');
            if (customer) {
                const checkPassword = await bcrypt.compare(password, customer.password);
                if (checkPassword) {
                    user = customer;
                    role = 'cliente'; // Atribui o papel genérico 'cliente'
                }
            }
        }

        // 3. Verifica se um usuário válido foi encontrado em qualquer coleção
        if (!user) {
            // Mensagem genérica por segurança (não informa se o e-mail existe)
            // Retorna 401 Unauthorized para falha de autenticação
            return res.status(401).json({ msg: "Email ou senha inválidos." });
        }

        // 4. Gera o Token JWT
        const secret = process.env.SECRET;
        // Validação crítica: Garante que a chave secreta está definida
        if (!secret) {
            console.error("Erro Crítico: Variável de ambiente SECRET não definida para JWT.");
            return res.status(500).json({ msg: "Erro de configuração no servidor." });
        }

        const token = jwt.sign(
            {
                id: user._id,
                // Usa 'name' para funcionário e 'nome' para cliente (ajuste conforme o seu modelo Cliente)
                name: user.name || user.nome,
                // Inclui o papel determinado ('adm', 'vendas', 'cliente') no token
                role: role
            },
            secret,
            // Adiciona expiração ao token (ex: 1 hora) - Altamente recomendado!
            { expiresIn: '1h' }
        );

        // 5. Envia a resposta de sucesso
        res.status(200).json({
            msg: "Autenticação realizada com sucesso!",
            token,
            // Retorna informações básicas do usuário (sem a senha!)
            user: {
                id: user._id,
                name: user.name || user.nome,
                email: user.email,
                role: role // Papel incluído na resposta
            }
        });

    } catch (error) {
        // Captura erros inesperados durante o processo
        console.error("Erro no processo de login:", error);
        res.status(500).json({ msg: "Ocorreu um erro interno no servidor durante o login." });
    }
};

module.exports = { registerUser, loginUser };