const User = require("../models/usuarioModel");
// Função para buscar um usuário em uma rota PÚBLICA 
const getPublicUser = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id, "-password");

    if (!user) {
      return res.status(404).json({ msg: "Usuário não encontrado!" });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ msg: "Aconteceu um erro no servidor." });
  }
};

// Função para buscar um usuário em uma rota PRIVADA
const getPrivateUser = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ msg: "Usuário não encontrado!" });
        }
        
        res.status(200).json({
            msg: "Você está na Área Restrita",
            user
        });
    } catch (error) {
        res.status(500).json({ msg: "Aconteceu um erro no servidor." });
    }
};

module.exports = {
  getPublicUser,
  getPrivateUser,
};