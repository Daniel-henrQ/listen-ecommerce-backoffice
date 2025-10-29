// backend/models/clienteModel.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const metodoPagamentoSchema = new mongoose.Schema({
    tipo: { type: String, enum: ['Cartão de Crédito', 'PIX', 'Google Pay'], default: 'Cartão de Crédito' },
    ultimosDigitos: { type: String, required: true },
    bandeira: { type: String, required: true },
    nomeTitular: { type: String, required: true },
    validade: { type: String, required: true }
}, { _id: true }); // _id: true para permitir a remoção individual

const clienteSchema = new mongoose.Schema({
    // ... outros campos do cliente
    nome: { type: String, required: true, trim: true },
    sobrenome: { type: String, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, select: false },
    cpf: { type: String, unique: true, sparse: true, trim: true },
    telefone: { type: String, trim: true },
    dataNascimento: { type: Date },
    endereco: {
        cep: { type: String, trim: true },
        logradouro: { type: String, trim: true },
        numero: { type: String, trim: true },
        complemento: { type: String, trim: true },
        bairro: { type: String, trim: true },
        cidade: { type: String, trim: true },
        estado: { type: String, trim: true },
    },
    metodosPagamento: [metodoPagamentoSchema], // Garante que é um array

    // --- ADICIONADO ---
    favoritos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Produto' }]

}, { timestamps: true });

// ... (restante do arquivo sem alterações)
const Cliente = mongoose.model('Cliente', clienteSchema);
module.exports = Cliente;