// backend/routes/clienteRoutes.js
const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const checkToken = require('../middleware/checkToken');
const checkRole = require('../middleware/checkRole');

// Middleware para todas as rotas de clientes
router.use(checkToken);
// CORREÇÃO: Permite acesso para 'adm' E 'vendas'
router.use(checkRole(['adm', 'vendas'])); // <<< ALTERAÇÃO AQUI

router.post('/', clienteController.criarCliente); // Nota: Vendas poderão criar clientes agora
router.get('/', clienteController.listarClientes);
router.get('/:id', clienteController.obterClientePorId);
router.put('/:id', clienteController.atualizarCliente); // Nota: Vendas poderão atualizar clientes agora
router.delete('/:id', clienteController.deletarCliente); // Nota: Vendas poderão deletar clientes agora

module.exports = router;