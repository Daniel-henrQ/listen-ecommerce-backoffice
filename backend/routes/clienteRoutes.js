// backend/routes/clienteRoutes.js
const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const checkToken = require('../middleware/checkToken');
const checkRole = require('../middleware/checkRole');

// --- ROTA PÚBLICA ---
// Rota para criar um novo cliente (registro no storefront)
router.post('/', clienteController.criarCliente);

// --- ROTAS PROTEGIDAS (PARA O PRÓPRIO CLIENTE LOGADO) ---
// Estas rotas exigem login (checkToken), mas não um cargo específico.
// O 'checkToken' deve anexar o ID do cliente logado ao req (ex: req.id)

// Rotas de Favoritos
router.get('/favoritos', checkToken, clienteController.getFavoritos);
router.post('/favoritos', checkToken, clienteController.addFavorito);
router.delete('/favoritos/:produtoId', checkToken, clienteController.removeFavorito);
router.delete('/favoritos', checkToken, clienteController.clearFavoritos);

// (Aqui você também pode adicionar rotas de "meu perfil", "meus pedidos", etc.)
// router.get('/perfil', checkToken, clienteController.getMeuPerfil);
// router.put('/perfil', checkToken, clienteController.updateMeuPerfil);


// --- ROTAS PROTEGIDAS (PARA ADMIN / VENDAS) ---
// Estas rotas gerenciam TODOS os clientes e exigem um cargo.
// Usamos .use() para aplicar os middlewares em todas as rotas abaixo.
router.use(checkToken);
router.use(checkRole(['adm', 'vendas']));

// Rotas para listar, obter, atualizar e deletar clientes (requerem token e role 'adm' ou 'vendas')
router.get('/', clienteController.listarClientes);
router.get('/:id', clienteController.obterClientePorId);
router.put('/:id', clienteController.atualizarCliente);
router.delete('/:id', clienteController.deletarCliente);

module.exports = router;