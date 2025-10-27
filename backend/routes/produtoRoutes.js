const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');
const checkToken = require('../middleware/checkToken');
const upload = require('../middleware/multer');

// As rotas agora são relativas a /api/produtos/
router.delete('/varios', checkToken, produtoController.deletarVariosProdutos);

router.post('/', checkToken, upload.single('imagem'), produtoController.criarProduto);

// Esta linha garante que a nova função seja chamada corretamente
router.post('/aprovar-compra', checkToken, produtoController.aprovarCompraEAtualizarEstoque);

// DEVE FICAR APENAS ESTA LINHA (SEM checkToken)
router.get('/', produtoController.listarProdutos);

router.delete('/:id', checkToken, produtoController.deletarProduto);

module.exports = router;