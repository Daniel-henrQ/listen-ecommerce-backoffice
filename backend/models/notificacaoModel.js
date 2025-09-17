const mongoose = require("mongoose");

const notificacaoSchema = new mongoose.Schema({
  mensagem: {
    type: String,
    required: true,
  },
  tipo: {
    type: String,
    enum: ['estoque_baixo', 'venda', 'info'],
    default: 'info',
  },
  lida: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true, // Adiciona createdAt e updatedAt
});

const Notificacao = mongoose.model("Notificacao", notificacaoSchema);

module.exports = Notificacao;