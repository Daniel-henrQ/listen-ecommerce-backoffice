const express = require('express');
const router = express.Router();
const notificacaoController = require('../controllers/notificacaoController');
const checkToken = require('../middleware/checkToken');

// Rotas para notificações
router.get('/', checkToken, notificacaoController.listarNotificacoes);
router.post('/ler', checkToken, notificacaoController.marcarComoLidas);
// Rota para excluir todas as notificações Lidas
router.delete('/read', checkToken, notificacaoController.excluirNotificacoesLidas);
module.exports = router;