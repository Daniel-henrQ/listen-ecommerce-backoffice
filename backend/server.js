// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const multer = require('multer');

// Conexão com o banco e serviços
const conectarBanco = require('./config');
const { init: initNotificacaoService } = require('./controllers/notificacaoService');

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

initNotificacaoService(io);

// Importação das rotas da API (mantidas como estão)
const produtoRoutes = require('./routes/produtoRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificacaoRoutes = require('./routes/notificacaoRoutes');
const fornecedorRoutes = require('./routes/fornecedorRoutes');
const compraRoutes = require('./routes/compraRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const vendaRoutes = require('./routes/vendaRoutes');
const relatorioRoutes = require('./routes/relatorioRoutes');


// Middlewares essenciais
app.use(cors());
app.use(express.json());

// --- CONFIGURAÇÃO CORRIGIDA E SIMPLIFICADA ---

// 1. Rotas da API: Todas as chamadas para /api serão tratadas primeiro.
app.use('/api/produtos', produtoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notificacoes', notificacaoRoutes);
// app.use('/api/fornecedores', fornecedorRoutes); // Removido duplicado
app.use('/api/fornecedores', fornecedorRoutes);
app.use('/api/compras', compraRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/vendas', vendaRoutes);
app.use('/api/relatorios', relatorioRoutes);

// 2. Servir a pasta de uploads estaticamente.
const publicPath = path.join(__dirname, '..', 'public');
app.use('/uploads', express.static(path.join(publicPath, 'uploads')));

// --- ALTERAÇÃO AQUI ---
// 3. Servir a aplicação STOREFRONT (storefront/dist) como a principal.
//    Certifique-se que o storefront tem um script de build que gera a pasta 'dist'.
const storefrontBuildPath = path.join(__dirname, '..', 'storefront', 'dist'); // Caminho para o build do storefront
app.use(express.static(storefrontBuildPath));
// --- FIM DA ALTERAÇÃO ---

// --- SERVIR O FRONTEND (BACKOFFICE) EM UM CAMINHO ESPECÍFICO ---
// Serve o backoffice (frontend) sob o prefixo /app
const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use('/app', express.static(frontendBuildPath)); // Serve os arquivos estáticos do backoffice em /app
app.get('/app/*', (req, res) => { // Redireciona sub-rotas do backoffice para o index.html dele
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});
// A rota de login do backoffice (/login) será tratada pelo router do frontend em /app/login

// 4. Rota "catch-all": Qualquer outra requisição deve servir o 'index.html' da aplicação STOREFRONT.
app.get('*', (req, res) => {
  // --- ALTERAÇÃO AQUI ---
  res.sendFile(path.join(storefrontBuildPath, 'index.html'), (err) => { // Aponta para o index.html do storefront
  // --- FIM DA ALTERAÇÃO ---
    if (err) {
      // Evita enviar erro se o arquivo não for encontrado (ex: favicon.ico),
      // pois pode ser uma requisição normal que o SPA não trata.
      if (err.status !== 404) {
         res.status(500).send(err);
      } else {
         // Para 404, simplesmente não faz nada ou envia um 404 padrão
         // res.status(404).send('Not Found'); // Descomente se quiser enviar 404
      }
    }
  });
});


// Conectar ao banco de dados
conectarBanco();

// Conexão WebSocket (mantida)
io.on('connection', (socket) => {
  console.log('Um utilizador conectou-se via WebSocket:', socket.id);
  socket.on('disconnect', () => {
    console.log('O utilizador desconectou-se:', socket.id);
  });
});

// Middleware de tratamento de erros (mantido)
app.use((err, req, res, next) => {
  console.error("ERRO CAPTURADO:", err.stack || err.message); // Log mais detalhado
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ msg: `Erro no upload: ${err.message}` });
  }
  if (err.message === 'Tipo de arquivo inválido.') {
    return res.status(422).json({ msg: err.message });
  }
  // Enviar uma resposta de erro genérica para o cliente
  res.status(500).json({ msg: 'Ocorreu um erro interno no servidor.' });
});

server.listen(PORT, () => {
  console.log(` Servidor rodando em http://localhost:${PORT}`);
});

// Código para encerramento gracioso (mantido)
const gracefulShutdown = (signal) => {
  console.log(`\nSinal ${signal} recebido. A encerrar a aplicação...`);
  server.close(() => {
    console.log('Servidor HTTP encerrado.');
    mongoose.connection.close(false).then(() => { // Mongoose retorna Promise
        console.log('Conexão com o MongoDB encerrada.');
        process.exit(0);
    }).catch(err => {
        console.error('Erro ao fechar conexão MongoDB:', err);
        process.exit(1);
    });
  });
};

process.once('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Para nodemon
process.on('SIGINT', () => gracefulShutdown('SIGINT')); // Ctrl+C
process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // kill