const express = require("express");
const router = express.Router();

const { 
    createUser, 
    getAllUsers, 
    updateUser, 
    deleteUser 
} = require("../controllers/adminController");

const checkToken = require("../middleware/checkToken");
const checkRole = require("../middleware/checkRole");

const adminOnly = checkRole(['adm']);

router.get("/users", checkToken, adminOnly, getAllUsers);
router.post("/users", checkToken, adminOnly, createUser);
router.put("/users/:id", checkToken, adminOnly, updateUser);
router.delete("/users/:id", checkToken, adminOnly, deleteUser);

module.exports = router;//