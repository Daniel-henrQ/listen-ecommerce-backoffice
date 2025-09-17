const nodemailer = require('nodemailer');

// Função para enviar e-mail manualmente
const enviarEmail = async (req, res) => {
  const { para, assunto, texto, html } = req.body;

  if (!para || !assunto || (!texto && !html)) {
    return res
      .status(400)
      .json({ msg: "Campos obrigatórios: para, assunto e texto ou html." });
  }

  try {
    // Verifica se as variáveis de ambiente essenciais estão carregadas
    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error("Variáveis de ambiente SMTP não configuradas!");
        return res.status(500).json({ msg: "Erro de configuração do servidor de e-mail." });
    }

    const transportador = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10), // Garante que a porta é um número
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Lógica robusta para o campo "from"
    const fromName = process.env.SMTP_FROM;
    const fromEmail = process.env.SMTP_USER;
    const from = `"${fromName}" <${fromEmail}>`;

    const info = await transportador.sendMail({
      from,
      to: para,
      subject: assunto,
      text: texto,
      html,
    });

    res.status(200).json({ msg: "E-mail enviado com sucesso!", info });
  } catch (erro) {
    // MODIFICAÇÃO IMPORTANTE: Envia o erro detalhado para o frontend
    console.error("Erro detalhado ao enviar e-mail:", erro);
    res.status(500).json({
        msg: "Ocorreu um erro ao tentar enviar o e-mail.",
        // A propriedade 'code' e a mensagem do erro são as mais importantes
        errorCode: erro.code,
        errorMessage: erro.message,
    });
  }
};

module.exports = {
    enviarEmail
};