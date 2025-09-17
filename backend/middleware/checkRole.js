/**
 * Middleware Factory para verificação de cargos (roles).
 * @param {string[]} allowedRoles - Um array de strings com os cargos permitidos.
 * @returns {function} - A função de middleware para o Express.
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    //Pega o usuário do objeto 'req', que foi adicionado pelo middleware 'checkToken'.
    const user = req.user;

    //Verifica se o usuário ou o cargo dele não existem.
    if (!user || !user.role) {
      return res.status(403).json({ msg: "Acesso negado. As informações de permissão não foram encontradas." });
    }

    //Verifica se o cargo do usuário está na lista de cargos permitidos para a rota.
    if (allowedRoles.includes(user.role)) {
      // Se o cargo for permitido, chama next() para passar para o controller da rota.
      next();
    } else {
      // Se o cargo não for permitido, retorna um erro 403 (Forbidden).
      return res.status(403).json({ msg: "Acesso negado. Você não tem permissão para este recurso." });
    }
  };
};

module.exports = checkRole;

