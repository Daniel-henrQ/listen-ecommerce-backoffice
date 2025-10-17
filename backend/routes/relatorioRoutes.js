const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorioController');
const checkToken = require('../middleware/checkToken');

// Protege todas as rotas de relatório com token
router.use(checkToken);

// Rota para buscar todos os dados do relatório para os gráficos
router.get('/data', relatorioController.getReportData);

// Rota para gerar o relatório em PDF
router.get('/pdf', relatorioController.generatePDFReport);

module.exports = router;