// backend/middleware/checkToken.js
const jwt = require("jsonwebtoken");

const checkToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(" ")[1] : authHeader;

  if (!token) {
    return res.status(401).json({ msg: "Acesso negado! Token não fornecido." });
  }

  try {
    const secret = process.env.SECRET;
    // *** ADICIONAR LOG AQUI ***
    console.log("[checkToken] Tentando verificar token. SECRET carregada:", secret ? `SIM (comprimento: ${secret.length})` : 'NÃO');
    // *** FIM DO LOG ***

    if (!secret) {
        console.error("Erro Crítico: Variável de ambiente SECRET não definida para JWT.");
        return res.status(500).json({ msg: "Erro de configuração no servidor." });
    }
    const decoded = jwt.verify(token, secret);

    req.user = {
        id: decoded.id,
        name: decoded.name,
        role: decoded.role
    };

    next();
  } catch (error) {
    console.error("[checkToken] Erro na verificação do token:", error.message); // Log mais detalhado do erro
    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ msg: "Token expirado!" });
    }
    // Adiciona log para outros erros JWT
    if (error.name === 'JsonWebTokenError') {
        console.error("[checkToken] Erro JWT:", error);
    }
    return res.status(401).json({ msg: "Token inválido!" });
  }
};

module.exports = checkToken;