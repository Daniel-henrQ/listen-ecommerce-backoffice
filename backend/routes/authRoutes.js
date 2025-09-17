const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController");

// Rota para registrar um novo usuário
// Ex: POST http://localhost:3000/auth/register
router.post("/register", registerUser);

// Rota para fazer login e obter um token
// Ex: POST http://localhost:3000/auth/login
router.post("/login", loginUser);

module.exports = router;