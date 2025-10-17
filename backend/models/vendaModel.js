const mongoose = require('mongoose');

// Schema para os detalhes do pagamento
const pagamentoSchema = new mongoose.Schema({
    metodo: {
        type: String,
        required: true,
        enum: ['Cartão de Crédito', 'PIX', 'Google Pay']
    },
    detalhes: {
        type: Map,
        of: String
    },
    status: {
        type: String,
        required: true,
        enum: ['Pendente', 'Aprovado', 'Recusado'],
        default: 'Pendente'
    }
}, { _id: false });

// Schema para os itens da venda
const itemVendaSchema = new mongoose.Schema({
    produto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'produto',
        required: true
    },
    quantidade: {
        type: Number,
        required: true,
        min: 1
    },
    precoUnitario: {
        type: Number,
        required: true
    }
}, { _id: false });

const vendaSchema = new mongoose.Schema({
    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cliente',
        required: true
    },
    itens: [itemVendaSchema],
    valorTotal: {
        type: Number,
        required: true
    },
    pagamento: pagamentoSchema,
    enderecoEntrega: {
        cep: { type: String, required: true },
        logradouro: { type: String, required: true },
        numero: { type: String, required: true },
        complemento: { type: String },
        bairro: { type: String, required: true },
        cidade: { type: String, required: true },
        estado: { type: String, required: true },
    },
    status: {
        type: String,
        required: true,
        enum: ['Processando', 'Pagamento Aprovado', 'Em Separação', 'Enviado', 'Entregue', 'Cancelado'],
        default: 'Processando'
    },
    codigoRastreio: {
        type: String,
        trim: true
    }
}, { timestamps: true });

const Venda = mongoose.model('Venda', vendaSchema);

module.exports = Venda;