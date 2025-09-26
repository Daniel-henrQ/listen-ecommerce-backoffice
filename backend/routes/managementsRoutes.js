const express = require("express");
const router = express.Router();

// CORREÇÃO: Importa os middlewares corretos
const checkToken = require("../middleware/checkToken");
const checkRole = require("../middleware/checkRole");

// Rota para o painel financeiro, acessível apenas por 'administrativo' e 'gerencia'
router.get(
    "/financeiro",
    checkToken, // 1. Verifica se o token é válido
    checkRole(['administrativo', 'gerencia']), // 2. Verifica se a role é permitida
    (req, res) => {
        res.status(200).json({
            msg: `Bem-vindo ao painel financeiro, ${req.user.name}!`,
            userRole: req.user.role
        });
    }
);
//
// Rota para o painel de TI, acessível apenas por 'ti' e 'gerencia'
router.get(
    "/infraestrutura",
    checkToken,
    checkRole(['ti', 'gerencia']),
    (req, res) => {
        res.status(200).json({
            msg: "Bem-vindo ao painel de infraestrutura de TI.",
            userRole: req.user.role
        });
    }
);

// Rota para o painel de vendas, acessível por todos que estiverem logados
router.get(
    "/vendas",
    checkToken, // Apenas verifica se está logado, não importa a role
    (req, res) => {
        res.status(200).json({ msg: "Painel de vendas acessível a todos os usuários logados." });
    }
);

module.exports = router;
