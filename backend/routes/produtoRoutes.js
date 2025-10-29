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
// Lista todos os produtos (ou filtra)
router.get('/', produtoController.listarProdutos);

// ==========================================================
// <<< NOVA ROTA ADICIONADA AQUI >>>
// ==========================================================
// Rota para buscar um produto específico por ID (pública, sem checkToken)
router.get('/:id', produtoController.buscarProdutoPorId);


// Rota para deletar um produto por ID
router.delete('/:id', checkToken, produtoController.deletarProduto);

module.exports = router;