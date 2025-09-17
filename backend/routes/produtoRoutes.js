const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');
const checkToken = require('../middleware/checkToken');
const upload = require('../middleware/multer');

// Rotas para múltiplos produtos
router.post('/produtos/varios', checkToken, produtoController.criarVariosProdutos);
router.delete('/produtos/varios', checkToken, produtoController.deletarVariosProdutos);

// Rotas para um único produto
router.post('/produtos', checkToken, upload.single('imagem'), produtoController.criarProduto);
router.get('/produtos', checkToken, produtoController.listarProdutos);
router.get('/produtos/:id', checkToken, produtoController.buscarProdutoPorId);
router.put('/produtos/:id', checkToken, upload.single('imagem'), produtoController.atualizarProduto);
router.delete('/produtos/:id', checkToken, produtoController.deletarProduto);

module.exports = router;