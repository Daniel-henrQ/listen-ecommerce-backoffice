const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');
const checkToken = require('../middleware/checkToken');
const upload = require('../middleware/multer');

// As rotas agora são relativas a /api/produtos/
router.post('/varios', checkToken, produtoController.deletarVariosProdutos); // Corrigido para chamar a função certa
router.delete('/varios', checkToken, produtoController.deletarVariosProdutos);

router.post('/', checkToken, upload.single('imagem'), produtoController.criarProduto);
router.get('/', checkToken, produtoController.listarProdutos);
router.put('/:id', checkToken, upload.single('imagem'), produtoController.atualizarProduto);
router.delete('/:id', checkToken, produtoController.deletarProduto);

module.exports = router;