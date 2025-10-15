const mongoose = require('mongoose');

const compraSchema = new mongoose.Schema({
  produto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'produto',
    required: true
  },
  fornecedor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fornecedor',
    required: true
  },
  comprador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quantidade: {
    type: Number,
    required: true,
    min: 1
  },
  precoUnitario: {
    type: Number,
    required: true,
    min: 0
  },
  precoTotal: {
    type: Number,
    required: true,
    min: 0
  },
  dataCompra: {
    type: Date,
    default: Date.now
  },
  numeroNotaFiscal: {
    type: String,
    unique: true
  },
    status: {
    type: String,
    enum: ['Processando', 'A caminho', 'Entregue', 'Finalizada', 'Cancelada'],
    default: 'Processando'
  },
}, {
  timestamps: true
});

// Gera um número de nota fiscal antes de salvar
compraSchema.pre('save', function(next) {
  if (!this.numeroNotaFiscal) {
    // Exemplo: ANO-MES-DIA-TIMESTAMP
    const now = new Date();
    const timestamp = now.getTime();
    this.numeroNotaFiscal = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${timestamp}`;
  }
  next();
});

const Compra = mongoose.model('Compra', compraSchema);

module.exports = Compra;