const mongoose = require("mongoose");

const notificacaoSchema = new mongoose.Schema({
  mensagem: {
    type: String,
    required: true,
  },
  tipo: {
    type: String,
    enum: [
      'estoque_baixo',
      'estoque_zerado', // Added from original
      'venda_nova',
      'venda_status',
      'compra_nova',
      'compra_status',
      'relatorio_gerado',
      'nota_fiscal_gerada',
      'fornecedor_crud',
      'admin_user_crud',
      'info' // Mantém o tipo genérico
    ],
    required: true, // Tornar obrigatório para clareza
  },
  lida: {
    type: Boolean,
    default: false,
  },
  // NOVO CAMPO: Para quem a notificação se destina (opcional)
  targetRole: {
    type: String,
    enum: ['adm', 'vendas'], // Define os papéis possíveis
    required: false // Não é obrigatório para notificações gerais
  },
  // NOVO CAMPO: ID da entidade relacionada (opcional, para links futuros)
  entidadeId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  }
}, {
  timestamps: true, // Adiciona createdAt e updatedAt
});

const Notificacao = mongoose.model("Notificacao", notificacaoSchema);

module.exports = Notificacao;