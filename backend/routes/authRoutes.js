const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController");

// Rota: POST /api/auth/register
router.post("/register", registerUser);

// Rota: POST /api/auth/login
router.post("/login", loginUser);

module.exports = router;