// backend/routes/clienteRoutes.js
const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const checkToken = require('../middleware/checkToken');
const checkRole = require('../middleware/checkRole');

// --- ROTA PÚBLICA ---
// Rota para criar um novo cliente (não requer token)
router.post('/', clienteController.criarCliente); //

// --- ROTAS PROTEGIDAS ---
// Aplica middlewares checkToken e checkRole daqui em diante
router.use(checkToken); //
router.use(checkRole(['adm', 'vendas'])); // Permite acesso para 'adm' E 'vendas'

// Rotas para listar, obter, atualizar e deletar clientes (requerem token e role 'adm' ou 'vendas')
router.get('/', clienteController.listarClientes); //
router.get('/:id', clienteController.obterClientePorId); //
router.put('/:id', clienteController.atualizarCliente); //
router.delete('/:id', clienteController.deletarCliente); //

module.exports = router;