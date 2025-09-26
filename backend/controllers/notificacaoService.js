const Notificacao = require('../models/notificacaoModel');

// Objeto para armazenar a instância do Socket.IO
const socket = {
  io: null,
};

// Função para inicializar o serviço com a instância do Socket.IO
const init = (ioInstance) => {
  socket.io = ioInstance;
};
//
const notificacaoService = {
  async criarNotificacao(mensagem, tipo) {
    try {
      const novaNotificacao = new Notificacao({ mensagem, tipo });
      const notificacaoSalva = await novaNotificacao.save();
      console.log(`Notificação de ${tipo} criada com sucesso.`);

      // Emite o evento apenas se o socket.io foi inicializado
      if (socket.io) {
        socket.io.emit('nova_notificacao', notificacaoSalva);
        console.log("Evento 'nova_notificacao' emitido via WebSocket.");
      }
    } catch (error) {
      console.error("Erro ao salvar notificação no banco de dados:", error);
    }
  },

  async notificarEstoqueBaixo(produto) {
    const mensagem = `Estoque baixo! O produto "${produto.nome}" (Artista: ${produto.artista}) atingiu ${produto.quantidade} unidades.`;
    await this.criarNotificacao(mensagem, 'estoque_baixo');
  },

  async notificarEstoqueZerado(produto) {
    const mensagem = `Estoque zerado! O produto "${produto.nome}" (Artista: ${produto.artista}) está esgotado.`;
    await this.criarNotificacao(mensagem, 'estoque_zerado');
  }
};

module.exports = { init, notificacaoService };