const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const metodoPagamentoSchema = new mongoose.Schema({
    tipo: { type: String, enum: ['Cartão de Crédito', 'PIX', 'Google Pay'], required: true },
    // Apenas para cartões, armazena informações não sensíveis
    ultimosDigitos: { type: String },
    bandeira: { type: String }, // Ex: Visa, Mastercard
    tokenPagamento: { type: String } // Representaria um token de um gateway de pagamento
}, { _id: false });

const clienteSchema = new mongoose.Schema({
    nome: { type: String, required: true, trim: true },
    sobrenome: { type: String, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, select: false },
    cpf: { type: String, unique: true, sparse: true, trim: true }, // sparse permite valores nulos não-únicos
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
        tipoResidencia: { type: String, trim: true }
    },

    metodosPagamento: [metodoPagamentoSchema]

}, { timestamps: true });

// Middleware para encriptar a senha antes de salvar
clienteSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const Cliente = mongoose.model('Cliente', clienteSchema);

module.exports = Cliente;