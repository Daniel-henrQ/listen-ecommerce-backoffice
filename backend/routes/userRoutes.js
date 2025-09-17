const express = require("express");
const router = express.Router();

// Importa o controlador de usuário CORRIGIDO
const { getPublicUser, getPrivateUser } = require("../controllers/userController");

// CORREÇÃO: Importa o middleware correto de verificação de token
const checkToken = require("../middleware/checkToken");

// Rota pública para buscar um usuário pelo ID (não retorna a senha)
// Ex: GET http://localhost:3000/user/public/60d...
router.get("/public/:id", getPublicUser);

// Rota privada que agora usa o middleware checkToken correto
router.get("/private/:id", checkToken, getPrivateUser);

module.exports = router;
