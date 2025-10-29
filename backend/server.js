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
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Em produção, restrinja para as origens dos seus frontends
    methods: ["GET", "POST"]
  }
});

// Inicializa o serviço de notificação com a instância do Socket.IO
initNotificacaoService(io);

// Importação das rotas da API (mantido como antes)
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
app.use(cors()); // Considere configurar origens específicas para produção
app.use(express.json());

// --- CONFIGURAÇÃO DAS ROTAS E ARQUIVOS ESTÁTICOS ---

// 1. ROTAS DA API (prefixo /api)
app.use('/api/produtos', produtoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notificacoes', notificacaoRoutes);
app.use('/api/fornecedores', fornecedorRoutes);
app.use('/api/compras', compraRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/vendas', vendaRoutes);
app.use('/api/relatorios', relatorioRoutes);

// 2. SERVIR ARQUIVOS DE UPLOAD (prefixo /uploads)
const publicPath = path.join(__dirname, '..', 'public');
app.use('/uploads', express.static(path.join(publicPath, 'uploads')));

// --- SERVIR OS FRONTENDS ESTÁTICOS (APENAS EM PRODUÇÃO) ---
if (process.env.NODE_ENV === 'production') {
    console.log('Modo de produção detetado. Servindo ficheiros estáticos...');

    // 3. SERVIR O FRONTEND (BACKOFFICE) a partir do caminho '/app'
    const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'dist');
    // Serve os ficheiros estáticos (JS, CSS, etc.) sob o prefixo /app
    app.use('/app', express.static(frontendBuildPath)); // <<< Importante: Prefixo /app aqui

    // Rota "catch-all" para o backoffice: Qualquer pedido para /app/*
    // deve servir o index.html do backoffice para permitir o roteamento do React.
    app.get('/app/*', (req, res) => { // <<< Rota específica para /app/*
        res.sendFile(path.resolve(frontendBuildPath, 'index.html'));
    });

    // 4. SERVIR O STOREFRONT a partir da raiz '/' (DEPOIS do backoffice)
    const storefrontBuildPath = path.join(__dirname, '..', 'storefront', 'dist');
    // Serve os ficheiros estáticos (JS, CSS, etc.) do storefront na raiz.
    app.use(express.static(storefrontBuildPath));

    // 5. ROTA "CATCH-ALL" PRINCIPAL para o STOREFRONT (Deve ser a ÚLTIMA rota de GET)
    // Qualquer pedido GET que não corresponda a /api/*, /uploads/* ou /app/*
    // deve servir o index.html do storefront.
    app.get('*', (req, res, next) => {
        // Verifica se a requisição NÃO é para API, uploads ou o backoffice (/app ou /app/)
        if (!req.originalUrl.startsWith('/api') &&
            !req.originalUrl.startsWith('/uploads') &&
            !req.originalUrl.startsWith('/app')) { // <<< Verifica se NÃO começa com /app
             res.sendFile(path.resolve(storefrontBuildPath, 'index.html'));
        } else {
             // Deixa outros middlewares ou a rota /app/* tratar o pedido
             next();
        }
    });

} else {
    // Modo de desenvolvimento
    console.log('Modo de desenvolvimento. Os frontends (Vite) devem estar a rodar separadamente.');
    app.get('/', (req, res) => {
      res.send('Servidor backend em execução. Aceda aos frontends pelas portas do Vite (ex: 5173 e 5174).');
    });
}
// --- FIM DA CONFIGURAÇÃO ESTÁTICA ---


// Conectar ao banco de dados MongoDB
conectarBanco();

// Lógica de conexão do Socket.IO (mantida como antes)
io.on('connection', (socket) => {
  console.log('Um utilizador conectou-se via WebSocket:', socket.id);
  socket.on('disconnect', () => {
    console.log('O utilizador desconectou-se:', socket.id);
  });
});

// Middleware de tratamento de erros (mantido como antes)
app.use((err, req, res, next) => {
  console.error("ERRO NÃO TRATADO:", err.stack || err.message);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ msg: `Erro no upload: ${err.message}` });
  }
  if (err.message === 'Tipo de arquivo inválido.') {
    return res.status(422).json({ msg: err.message });
  }
  res.status(500).json({ msg: 'Ocorreu um erro interno no servidor.' });
});

// Iniciar o servidor (mantido como antes)
server.listen(PORT, () => {
  console.log(` Servidor rodando em http://localhost:${PORT}`);
    if (process.env.NODE_ENV !== 'production') {
      console.log(' Lembre-se de iniciar os servidores Vite para o storefront e frontend separadamente (ex: portas 5173 e 5174).');
  }
});

// Código para encerramento gracioso (mantido como antes)
const gracefulShutdown = (signal) => {
  console.log(`\nSinal ${signal} recebido. A encerrar a aplicação...`);
  server.close(() => {
    console.log('Servidor HTTP encerrado.');
    mongoose.connection.close(false).then(() => {
        console.log('Conexão com o MongoDB encerrada.');
        process.exit(0);
    }).catch(err => {
        console.error('Erro ao fechar conexão MongoDB:', err);
        process.exit(1);
    });
  });
  setTimeout(() => {
    console.error('Encerramento forçado após timeout.');
    process.exit(1);
  }, 10000);
};
process.once('SIGUSR2', () => gracefulShutdown('SIGUSR2'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));