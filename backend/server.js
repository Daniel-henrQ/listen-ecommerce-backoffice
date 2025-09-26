// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const multer = require('multer'); 

// Conexão com banco
const conectarBanco = require('./config');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
//
module.exports.io = io;
//
// Importação das rotas
const produtoRoutes = require('./routes/produtoRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificacaoRoutes = require('./routes/notificacaoRoutes');
// --- Removido rotas não utilizadas para limpar ---
// const userRoutes = require('./routes/userRoutes');
// const managementRoutes = require('./routes/managementsRoutes');
// const emailRoutes = require('./routes/emailRoutes');


// Middlewares essenciais
app.use(cors());
app.use(express.json());

// Servir a pasta de uploads estaticamente
const publicPath = path.join(__dirname, '..', 'public');
app.use('/uploads', express.static(path.join(publicPath, 'uploads')));

conectarBanco();


// --- CORREÇÃO PRINCIPAL: Configuração Padronizada das Rotas da API ---
app.use('/api/produtos', produtoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notificacoes', notificacaoRoutes);
// ----------------------------------------------------------------


// --- Configuração para Servir o Frontend React em Produção ---
const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendBuildPath));

// Rota "catch-all": Para qualquer outro pedido, serve o index.html do React
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'), (err) => {
    if (err) {
      res.status(500).send(err);
    }
  });
});


// Conexão WebSocket
io.on('connection', (socket) => {
  console.log('Um utilizador conectou-se via WebSocket:', socket.id);
  socket.on('disconnect', () => {
    console.log('O utilizador desconectou-se:', socket.id);
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error("ERRO CAPTURADO:", err.message); 
 
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ msg: err.message });
  }

  if (err.message === 'Tipo de arquivo inválido.') {
    return res.status(422).json({ msg: err.message });
  }

  res.status(500).json({ msg: 'Ocorreu um erro interno no servidor.' });
});

server.listen(PORT, () => {
  console.log(` Servidor rodando em http://localhost:${PORT}`);
});

// Código para encerramento gracioso (sem alterações)
const gracefulShutdown = (signal) => {
  console.log(`\nSinal ${signal} recebido. A encerrar a aplicação...`);
  server.close(() => {
    console.log('Servidor HTTP encerrado.');
    mongoose.connection.close(false, () => {
      console.log('Conexão com o MongoDB encerrada.');
      process.exit(0);
    });
  });
};

process.once('SIGUSR2', () => gracefulShutdown('SIGUSR2'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));