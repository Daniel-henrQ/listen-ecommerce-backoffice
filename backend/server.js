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

module.exports.io = io;

const produtoRoutes = require('./routes/produtoRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const managementRoutes = require('./routes/managementsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const emailRoutes = require('./routes/emailRoutes');
const notificacaoRoutes = require('./routes/notificacaoRoutes');

app.use(cors());
app.use(express.json());

const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));
app.use('/uploads', express.static(path.join(publicPath, 'uploads')));

conectarBanco();

app.use('/api', produtoRoutes);
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/management', managementRoutes);
app.use('/admin', adminRoutes);
app.use('/api', emailRoutes);
app.use('/api', notificacaoRoutes);

io.on('connection', (socket) => {
  console.log('Um utilizador conectou-se via WebSocket:', socket.id);
  socket.on('disconnect', () => {
    console.log('O utilizador desconectou-se:', socket.id);
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'login.html'));
});

app.get('/app', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Este middleware irá capturar
app.use((err, req, res, next) => {
  console.error("ERRO CAPTURADO:", err.message); // Loga o erro no console do servidor

 
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ msg: err.message });
  }

  // Verifica se é o nosso erro customizado do filtro de arquivos
  if (err.message === 'Tipo de arquivo inválido.') {
    return res.status(422).json({ msg: err.message });
  }

  // Para qualquer outro erro inesperado
  res.status(500).json({ msg: 'Ocorreu um erro interno no servidor.' });
});


app.use((req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/auth')) {
      res.status(404).send(`<h1>Erro 404: Página não encontrada</h1><p>A rota ${req.path} não foi encontrada no servidor.</p>`);
  } else {
      res.status(404).json({ error: 'Rota de API não encontrada' });
  }
});

server.listen(PORT, () => {
  console.log(` Servidor rodando em http://localhost:${PORT}`);
});

// =================================================================
// SOLUÇÃO PARA O ERRO EADDRINUSE
// =================================================================
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
