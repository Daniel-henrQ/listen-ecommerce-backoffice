// backend/middleware/checkToken.js
const jwt = require("jsonwebtoken");

/**
 * Middleware para verificar a validade de um token JWT.
 */
const checkToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  // Remove o 'Bearer ' se existir, caso contrário usa o header diretamente
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(" ")[1] : authHeader;


  if (!token) {
    return res.status(401).json({ msg: "Acesso negado! Token não fornecido." });
  }

  try {
    const secret = process.env.SECRET;
    if (!secret) {
        console.error("Erro Crítico: Variável de ambiente SECRET não definida para JWT.");
        // Retorna 500 Internal Server Error em caso de falha de configuração
        return res.status(500).json({ msg: "Erro de configuração no servidor." });
    }
    const decoded = jwt.verify(token, secret);

    // Anexa as informações do usuário decodificadas do token
    req.user = {
        id: decoded.id,
        name: decoded.name,
        role: decoded.role
    };

    next(); // Continua para a próxima rota/middleware
  } catch (error) {
    // Loga o erro específico no servidor
    console.error("Erro na verificação do token:", error.message);

    // Retorna 400 Bad Request se o token for inválido ou malformado
    // Retorna 401 Unauthorized se o token expirou (embora jwt.verify lance erro genérico às vezes)
    // Uma resposta 401 é mais semanticamente correta para problemas de autenticação/autorização
    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ msg: "Token expirado!" });
    }
    return res.status(401).json({ msg: "Token inválido!" });
  }
};

module.exports = checkToken;