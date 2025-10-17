const express = require('express');
const router = express.Router();
const vendaController = require('../controllers/vendaController');
const checkToken = require('../middleware/checkToken');
const checkRole = require('../middleware/checkRole');

// Todas as rotas de vendas são protegidas e acessíveis por admins e vendedores
router.use(checkToken);
router.use(checkRole(['adm', 'vendas']));

router.post('/', vendaController.criarVenda);
router.get('/', vendaController.listarVendas);
router.get('/:id', vendaController.obterVendaPorId);
router.put('/:id/status', vendaController.atualizarStatusVenda);
router.put('/:id/rastreio', vendaController.adicionarCodigoRastreio);

module.exports = router;