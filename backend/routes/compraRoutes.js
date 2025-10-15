const express = require('express');
const router = express.Router();
const compraController = require('../controllers/compraController');
const checkToken = require('../middleware/checkToken');

// Todas as rotas de compras requerem um token válido
router.use(checkToken);

router.post('/', compraController.criarCompra);
router.get('/', compraController.listarCompras);
router.get('/:id/nota', compraController.gerarNotaFiscalPDF); // Rota para o PDF
router.patch('/:id/status', compraController.atualizarStatusCompra); // Nova rota para atualizar o status

module.exports = router;