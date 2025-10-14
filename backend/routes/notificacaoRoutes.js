const express = require('express');
const router = express.Router();
const notificacaoController = require('../controllers/notificacaoController');
const checkToken = require('../middleware/checkToken');

// Rotas para notificações
router.get('/', checkToken, notificacaoController.listarNotificacoes);
router.post('/ler', checkToken, notificacaoController.marcarComoLidas);

module.exports = router;