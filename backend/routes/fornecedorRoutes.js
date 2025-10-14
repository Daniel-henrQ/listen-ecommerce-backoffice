const express = require('express');
const router = express.Router();
const fornecedorController = require('../controllers/fornecedorController');
const checkToken = require('../middleware/checkToken');

// Todas as rotas de fornecedores requerem um token válido
router.use(checkToken);

router.post('/', fornecedorController.criarFornecedor);
router.get('/', fornecedorController.listarFornecedores);
router.put('/:id', fornecedorController.atualizarFornecedor);
router.delete('/:id', fornecedorController.deletarFornecedor);

module.exports = router;