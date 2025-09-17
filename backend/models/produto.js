const mongoose = require('mongoose');

const produtoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true
  },
  artista: {
    type: String,
    required: true,
    trim: true
  },
  categoria: {
    type: String,
    required: true,
    trim: true
  },
  preco: {
    type: Number,
    required: true,
    min: 0
  },
  quantidade: {
    type: Number,
    required: true,
    min: 0
  },
  imagem: {
    type: String, // URL opcional
    default: ''
  }
}, {
  timestamps: true // cria campos createdAt e updatedAt automaticamente
});

const Produto = mongoose.model('Produto', produtoSchema);

module.exports = Produto;
