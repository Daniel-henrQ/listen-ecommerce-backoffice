const mongoose = require('mongoose');

const fornecedorSchema = new mongoose.Schema({
  nomeFantasia: { type: String, required: true, trim: true },
  razaoSocial: { type: String, required: true, unique: true, trim: true },
  cnpj: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  telefone: { type: String, required: true, trim: true },
  endereco: {
    logradouro: { type: String, trim: true },
    numero: { type: String, trim: true },
    complemento: { type: String, trim: true },
    bairro: { type: String, trim: true },
    cidade: { type: String, required: true, trim: true },
    estado: { type: String, required: true, trim: true },
    cep: { type: String, trim: true },
  },
  pessoaContato: { type: String, trim: true },
}, {
  timestamps: true // Adiciona os campos createdAt e updatedAt automaticamente
});

const Fornecedor = mongoose.model('Fornecedor', fornecedorSchema);

module.exports = Fornecedor;