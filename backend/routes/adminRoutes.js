const express = require("express");
const router = express.Router();

const { 
    createUser, 
    getAllUsers, 
    updateUser, 
    deleteUser 
} = require("../controllers/adminController");

// Importações corrigidas dos middlewares
const checkToken = require("../middleware/checkToken");
const checkRole = require("../middleware/checkRole");

// Permissão para todas as rotas: apenas 'adm'
const adminOnly = checkRole(['adm']);

// Ordem de execução: 1º checkToken, 2º adminOnly (que é o checkRole)
router.get("/users", checkToken, adminOnly, getAllUsers);
router.post("/users", checkToken, adminOnly, createUser);
router.put("/users/:id", checkToken, adminOnly, updateUser);
router.delete("/users/:id", checkToken, adminOnly, deleteUser);

module.exports = router;