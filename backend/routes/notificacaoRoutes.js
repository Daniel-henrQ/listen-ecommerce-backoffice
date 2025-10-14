const express = require('express');
const router = express.Router();
const notificacaoController = require('../controllers/notificacaoController');
const checkToken = require('../middleware/checkToken');

// Rotas para notificações
// CORREÇÃO: Removido '/notificacoes' para usar o caminho base definido no server.js
router.get('/', checkToken, notificacaoController.listarNotificacoes);
router.post('/ler', checkToken, notificacaoController.marcarComoLidas);

module.exports = router;