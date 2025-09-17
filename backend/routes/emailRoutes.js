const express = require('express');
const router = express.Router();
const { enviarEmail } = require('../controllers/emailController');

// Rota para enviar e-mail manualmente
// Ex: POST http://localhost:3000/api/enviar-email
// Você pode adicionar um middleware de autenticação se quiser que apenas usuários logados enviem e-mails.
router.post('/enviar-email',  enviarEmail); 

module.exports = router;