const Notificacao = require('../models/notificacaoModel');
const jwt = require('jsonwebtoken'); // Importar jwt

// Objeto para armazenar a instância do Socket.IO
const socket = {
  io: null,
};

// Função para inicializar o serviço com a instância do Socket.IO
const init = (ioInstance) => {
  socket.io = ioInstance;

  // NOVO: Lógica para associar role ao socket na conexão
  ioInstance.use((socket, next) => {
    const token = socket.handshake.auth.token; // Espera que o token seja enviado via auth
    if (token) {
      try {
        const secret = process.env.SECRET;
        if (!secret) {
            console.error("Variável de ambiente SECRET não definida para JWT.");
            return next(new Error('Authentication error: Server configuration issue'));
        }
        const decoded = jwt.verify(token, secret);
        socket.userRole = decoded.role; // Associa o role ao socket
        console.log(`Socket ${socket.id} associado ao role: ${socket.userRole}`);
      } catch (err) {
        console.error(`Falha ao verificar token do socket ${socket.id}:`, err.message);
        // Pode desconectar o socket ou permitir conexão sem role
         return next(new Error('Authentication error: Invalid token')); // Recusa a conexão se o token for inválido
      }
    } else {
        console.warn(`Socket ${socket.id} conectado sem token.`);
        // Permite a conexão, mas sem userRole associado
    }
    next();
  });
};

const notificacaoService = {
  // Modificado para aceitar targetRole e entidadeId
  async criarNotificacao(mensagem, tipo, targetRole = null, entidadeId = null) {
    try {
      const novaNotificacao = new Notificacao({
        mensagem,
        tipo,
        targetRole, // Salva o role alvo no DB
        entidadeId
       });
      const notificacaoSalva = await novaNotificacao.save();
      console.log(`Notificação de ${tipo} criada.`);

      if (socket.io) {
        if (targetRole) {
          // Emite apenas para sockets com o role correspondente
          socket.io.sockets.sockets.forEach(s => {
            // Verifica se o socket tem userRole definido E se corresponde ao targetRole
            if (s.userRole && s.userRole === targetRole) {
              s.emit('nova_notificacao', notificacaoSalva);
               console.log(`Notificação ${tipo} emitida para ${targetRole} ${s.id}`);
            }
          });
        } else {
          // Emite para todos os sockets autenticados (que têm userRole) se não houver targetRole específico
          socket.io.sockets.sockets.forEach(s => {
             if (s.userRole) { // Garante que só usuários logados recebem notificações gerais
                 s.emit('nova_notificacao', notificacaoSalva);
             }
          });
          console.log(`Notificação ${tipo} emitida para todos os autenticados.`);
        }
      }
    } catch (error) {
      console.error("Erro ao criar/emitir notificação:", error);
    }
  },

  // Funções específicas (mantidas, mas agora chamam a nova criarNotificacao)
  async notificarEstoqueBaixo(produto) {
    const mensagem = `Estoque baixo: "${produto.nome}" (${produto.artista || 'Artista não informado'}) tem ${produto.quantidade} unidades.`;
    // Notificação geral para todos autenticados (adm e vendas)
    await this.criarNotificacao(mensagem, 'estoque_baixo', null, produto._id);
  },

  async notificarEstoqueZerado(produto) {
    const mensagem = `Estoque zerado: "${produto.nome}" (${produto.artista || 'Artista não informado'}).`;
    // Notificação geral para todos autenticados (adm e vendas)
    await this.criarNotificacao(mensagem, 'estoque_zerado', null, produto._id);
  },

  // NOVAS Funções específicas
  async notificarNovaVenda(venda, clienteNome) {
    const mensagem = `Nova venda registrada para ${clienteNome || 'Cliente desconhecido'} (Total: R$ ${venda.valorTotal.toFixed(2)}).`;
    // Notificação geral para autenticados
    await this.criarNotificacao(mensagem, 'venda_nova', null, venda._id);
  },

  async notificarStatusVenda(vendaId, novoStatus, clienteNome) {
      const mensagem = `Status da venda #${String(vendaId).slice(-6)} (${clienteNome || 'Cliente'}) atualizado para: ${novoStatus}.`;
      // Notificação geral para autenticados
      await this.criarNotificacao(mensagem, 'venda_status', null, vendaId);
  },

  async notificarNovaCompra(compra, fornecedorNome) {
      const mensagem = `Nova compra registrada do fornecedor ${fornecedorNome || 'desconhecido'} (Total: R$ ${compra.precoTotal.toFixed(2)}).`;
      // Notificação geral para autenticados
      await this.criarNotificacao(mensagem, 'compra_nova', null, compra._id);
  },

   async notificarStatusCompra(compraId, novoStatus, fornecedorNome) {
      const mensagem = `Status da compra #${String(compraId).slice(-6)} (${fornecedorNome || 'Fornecedor'}) atualizado para: ${novoStatus}.`;
      // Notificação geral para autenticados
      await this.criarNotificacao(mensagem, 'compra_status', null, compraId);
   },

   async notificarNotaGerada(entidadeId, tipo = 'compra') { // Alterado para entidadeId genérico
       const mensagem = `Nota fiscal da ${tipo} #${String(entidadeId).slice(-6)} foi gerada.`;
       // Notificação geral para autenticados
       await this.criarNotificacao(mensagem, 'nota_fiscal_gerada', null, entidadeId);
   },

   async notificarFornecedor(acao, nomeFantasia, fornecedorId) {
       const acaoMap = { 'create': 'criado', 'update': 'atualizado', 'delete': 'deletado' };
       const mensagem = `Fornecedor "${nomeFantasia}" foi ${acaoMap[acao]}.`;
       // Notificação geral para autenticados
       await this.criarNotificacao(mensagem, 'fornecedor_crud', null, fornecedorId);
   },

   async notificarAdminUser(acao, userName, userId) {
        const acaoMap = { 'create': 'criado', 'update': 'atualizado', 'delete': 'deletado' };
        const mensagem = `Usuário "${userName}" foi ${acaoMap[acao]} no sistema.`;
        // Notificação *apenas* para administradores
        await this.criarNotificacao(mensagem, 'admin_user_crud', 'adm', userId);
   },

   async notificarRelatorioGerado(tipoRelatorio, periodo) {
       const mensagem = `Relatório de ${tipoRelatorio} (${periodo}) foi gerado.`;
       // Notificação para administradores
       await this.criarNotificacao(mensagem, 'relatorio_gerado', 'adm');
   }
};

module.exports = { init, notificacaoService };