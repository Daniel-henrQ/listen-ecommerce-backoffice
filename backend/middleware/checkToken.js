// backend/middleware/checkToken.js
const jwt = require("jsonwebtoken");

/**
 * Middleware para verificar a validade de um token JWT.
 * MODIFICADO: Em ambiente de desenvolvimento (NODE_ENV !== 'production'),
 * bypassa a verificação do token e adiciona um usuário 'dev' mockado.
 */
const checkToken = (req, res, next) => {

  // --- INÍCIO DA MODIFICAÇÃO PARA DESENVOLVIMENTO ---
  // Verifica se a variável de ambiente NODE_ENV NÃO é 'production'
  if (process.env.NODE_ENV !== 'production') {
    console.warn("MODO DEV (BACKEND): Verificação de token DESABILITADA.");
    // Simula um usuário logado (ex: admin) para permitir o acesso às rotas
    // Ajuste 'id', 'name' e 'role' conforme necessário para seus testes
    req.user = {
      id: 'dev-user-id', // ID de usuário mockado
      name: 'Desenvolvedor', // Nome mockado
      role: 'adm' // Papel mockado (pode ser 'adm' ou 'vendas')
    };
    return next(); // Pula toda a verificação de token e continua
  }
  // --- FIM DA MODIFICAÇÃO PARA DESENVOLVIMENTO ---

  // --- LÓGICA ORIGINAL PARA PRODUÇÃO ---
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    // Em produção, continua negando se não houver token
    return res.status(401).json({ msg: "Acesso negado! Token não fornecido." });
  }

  try {
    const secret = process.env.SECRET;
    // Validação da SECRET ainda é importante para produção
    if (!secret) {
        console.error("Erro Crítico (PROD): Variável de ambiente SECRET não definida para JWT.");
        return res.status(500).json({ msg: "Erro de configuração no servidor." });
    }
    const decoded = jwt.verify(token, secret);

    // Anexa as informações do usuário real (decodificadas do token)
    req.user = {
        id: decoded.id,
        name: decoded.name,
        role: decoded.role
    };

    next(); // Continua para a próxima rota/middleware
  } catch (error) {
    // Em produção, retorna erro se o token for inválido
    console.error("Erro de token em produção:", error.message); // Log mais detalhado em prod
    res.status(400).json({ msg: "Token inválido!" });
  }
};

module.exports = checkToken;