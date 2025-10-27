// backend/models/produtoModel.js
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
  subgeneros: [{ // Campo para subgêneros
    type: String,
    trim: true
  }],
  // NOVO CAMPO ADICIONADO ABAIXO
  descricao: {
    type: String,
    trim: true,
    default: '' // Valor padrão como string vazia
  }
}, {
  timestamps: true
});

const Produto = mongoose.model('produto', produtoSchema);

module.exports = Produto;