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
  fornecedor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fornecedor', // Referência ao modelo Fornecedor
    required: true
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
    type: String,
    default: ''
  },
  subgeneros: [{ // Novo campo para subgêneros
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

const Produto = mongoose.model('produto', produtoSchema);

module.exports = Produto;