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

// Importação das rotas da API
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

// --- CONFIGURAÇÃO DAS ROTAS E ARQUIVOS ESTÁTICOS ---

// 1. ROTAS DA API
app.use('/api/produtos', produtoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notificacoes', notificacaoRoutes);
app.use('/api/fornecedores', fornecedorRoutes);
app.use('/api/compras', compraRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/vendas', vendaRoutes);
app.use('/api/relatorios', relatorioRoutes);

// 2. SERVIR ARQUIVOS DE UPLOAD
const publicPath = path.join(__dirname, '..', 'public');
app.use('/uploads', express.static(path.join(publicPath, 'uploads')));

// --- SERVIR OS FRONTENDS ESTÁTICOS (APENAS EM PRODUÇÃO) ---
if (process.env.NODE_ENV === 'production') {
    console.log('Modo de produção detetado. Servindo ficheiros estáticos...');

    // 3. SERVIR O FRONTEND (BACKOFFICE) a partir do caminho '/app'
    const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'dist');
    app.use('/app', express.static(frontendBuildPath)); // Serve arquivos estáticos (JS, CSS)

    // Rota "catch-all" para o backoffice: /app ou /app/*
    // A sua versão original `app.get(['/app', '/app/*'], ...)` está correta.
    // Nenhuma alteração necessária aqui se ela funciona.
    app.get(['/app', '/app/*'], (req, res) => {
        res.sendFile(path.resolve(frontendBuildPath, 'index.html'));
    });

    // 4. SERVIR O STOREFRONT a partir da raiz '/'
    const storefrontBuildPath = path.join(__dirname, '..', 'storefront', 'dist');
    app.use(express.static(storefrontBuildPath)); // Serve arquivos estáticos (JS, CSS) na raiz

    // 5. ROTA "CATCH-ALL" PRINCIPAL para o STOREFRONT (Deve ser a ÚLTIMA rota)
    app.get('*', (req, res) => {
        // Verifica se a requisição não é para a API nem para uploads
        if (!req.originalUrl.startsWith('/api') && !req.originalUrl.startsWith('/uploads')) {
             res.sendFile(path.resolve(storefrontBuildPath, 'index.html'));
        } else {
             // Deixa outros middlewares (ou erro 404 padrão do Express) lidarem com API/uploads não encontrados
             next();
        }
    });

} else {
    // Modo de desenvolvimento
    console.log('Modo de desenvolvimento. Os frontends (Vite) devem estar a rodar separadamente.');
    app.get('/', (req, res) => {
      res.send('Servidor backend em execução. Aceda aos frontends pelas portas do Vite.');
    });
}
// --- FIM DA CONFIGURAÇÃO ESTÁTICA ---


// Conectar ao banco de dados MongoDB
conectarBanco();

// Lógica de conexão do Socket.IO
io.on('connection', (socket) => {
  console.log('Um utilizador conectou-se via WebSocket:', socket.id);
  socket.on('disconnect', () => {
    console.log('O utilizador desconectou-se:', socket.id);
  });
});

// Middleware de tratamento de erros
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

// Iniciar o servidor
server.listen(PORT, () => {
  console.log(` Servidor rodando em http://localhost:${PORT}`);
    if (process.env.NODE_ENV !== 'production') {
      console.log(' Lembre-se de iniciar os servidores Vite para o storefront e frontend separadamente (ex: portas 5173 e 5174).');
  }
});

// --- Código para encerramento gracioso 

const gracefulShutdown = (signal) => {
  console.log(`\nSinal ${signal} recebido. A encerrar a aplicação...`);
  server.close(() => {
    console.log('Servidor HTTP encerrado.');
    mongoose.connection.close(false).then(() => {
        console.log('Conexão com o MongoDB encerrada.');
        process.exit(0); // Sai do processo Node.js com sucesso
    }).catch(err => {
        console.error('Erro ao fechar conexão MongoDB:', err);
        process.exit(1); // Sai com código de erro
    });
  });

  // Força o encerramento após um tempo limite se o servidor não fechar
  setTimeout(() => {
    console.error('Encerramento forçado após timeout.');
    process.exit(1);
  }, 10000); // 10 segundos de timeout
};

// Captura sinais de encerramento
process.once('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Usado pelo nodemon
process.on('SIGINT', () => gracefulShutdown('SIGINT')); // Ctrl+C
process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // Comando 'kill'
// --- Fim do encerramento gracioso ---