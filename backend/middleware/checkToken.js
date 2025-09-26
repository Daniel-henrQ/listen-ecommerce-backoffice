const jwt = require("jsonwebtoken");

/**
 * Middleware para verificar a validade de um token JWT.
 * Este middleware DEVE ser executado ANTES de qualquer middleware que verifique permissões (roles).
 */
const checkToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ msg: "Acesso negado! Token não fornecido." });
  }

  try {
    const secret = process.env.SECRET;
    const decoded = jwt.verify(token, secret);
    
    // Anexa as informações do usuário (id, name, role) ao objeto de requisição.
    // Isso é crucial para que o middleware checkRole funcione.
    req.user = {
        id: decoded.id,
        name: decoded.name,
        role: decoded.role
    };

    next(); // Continua para a próxima rota/middleware
  } catch (error) {
    res.status(400).json({ msg: "Token inválido!" });
  }
};//

module.exports = checkToken;