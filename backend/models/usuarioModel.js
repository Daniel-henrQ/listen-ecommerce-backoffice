const mongoose = require("mongoose");

const User = mongoose.model("User", {
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
    cpf: {
    type: String,
    required: true,
    unique: true, // CPF deve ser único
    trim: true
  },
  password: {
    type: String,
    required: true,
    select: false, // Alterado para 'false' para não retornar a senha em consultas
  },
  role: {
    type: String,
    required: true,
    enum: ['adm','vendas'], // Garante que apenas estes valores são aceites
    default: 'vendas' // Define um papel padrão para novos usuários
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = User;