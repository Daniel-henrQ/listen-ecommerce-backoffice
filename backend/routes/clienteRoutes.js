// backend/routes/clienteRoutes.js
const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const checkToken = require('../middleware/checkToken');
const checkRole = require('../middleware/checkRole');

// Middleware para todas as rotas de clientes
router.use(checkToken);
router.use(checkRole(['adm'])); // Apenas administradores podem gerenciar clientes

router.post('/', clienteController.criarCliente);
router.get('/', clienteController.listarClientes);
router.get('/:id', clienteController.obterClientePorId);
router.put('/:id', clienteController.atualizarCliente);
router.delete('/:id', clienteController.deletarCliente);

module.exports = router;