const Notificacao = require('../models/notificacaoModel');
const User = require('../models/usuarioModel');
const nodemailer = require('nodemailer');
const { io } = require('../server'); // Importe a instância 'io'

// ... (a função enviarEmailNotificacao continua igual)
async function enviarEmailNotificacao(para, assunto, texto) {
  try {
    const transportador = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const fromName = process.env.SMTP_FROM_NAME || 'Listen App Alertas';
    const fromEmail = process.env.SMTP_USER;
    const from = `"${fromName}" <${fromEmail}>`;

    await transportador.sendMail({ from, to: para, subject: assunto, text: texto });
    console.log(`E-mail de notificação enviado para: ${para}`);
  } catch (error) {
    console.error(`Falha ao enviar e-mail de notificação para ${para}:`, error);
  }
}


const notificacaoService = {
  async criarNotificacaoEstoqueBaixo(produto) {
    const mensagem = `O produto "${produto.nome}" (Artista: ${produto.artista}) está com o estoque zerado!`;

    // 1. Salvar notificação no banco de dados
    try {
      const novaNotificacao = new Notificacao({
        mensagem: mensagem,
        tipo: 'estoque_baixo',
      });
      const notificacaoSalva = await novaNotificacao.save();
      console.log("Notificação de estoque baixo criada com sucesso.");

      // --- EMITIR EVENTO SOCKET.IO ---
      if (io) {
        // Envia a notificação para todos os clientes conectados
        io.emit('nova_notificacao', notificacaoSalva);
        console.log("Evento 'nova_notificacao' emitido via WebSocket.");
      }
      // -----------------------------

    } catch (error) {
      console.error("Erro ao salvar notificação no banco de dados:", error);
    }

    // 2. Enviar e-mail para todos os administradores (lógica existente)
    try {
      const admins = await User.find({ role: 'adm' });
      if (admins.length > 0) {
        const adminEmails = admins.map(admin => admin.email).join(', ');
        const assunto = "Alerta de Estoque Zerado";
        
        await enviarEmailNotificacao(adminEmails, assunto, mensagem);
      }
    } catch (error) {
      console.error("Erro ao buscar ou notificar administradores:", error);
    }
  }
};

module.exports = notificacaoService;