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
    origin: "*", // Em produção, restrinja isto ao URL do seu frontend
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

// --- CONFIGURAÇÃO CORRIGIDA E SIMPLIFICADA ---

// 1. Rotas da API: Todas as chamadas para /api serão tratadas primeiro.
app.use('/api/produtos', produtoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notificacoes', notificacaoRoutes);
app.use('/api/fornecedores', fornecedorRoutes);
app.use('/api/compras', compraRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/vendas', vendaRoutes);
app.use('/api/relatorios', relatorioRoutes);

// 2. Servir a pasta de uploads estaticamente.
const publicPath = path.join(__dirname, '..', 'public');
app.use('/uploads', express.static(path.join(publicPath, 'uploads')));

// --- ALTERAÇÃO AQUI: Servir frontends estáticos apenas em produção ---
if (process.env.NODE_ENV === 'production') {
    console.log('Modo de produção detetado. A servir ficheiros estáticos...');

    // 3. Servir a aplicação STOREFRONT (storefront/dist) como a principal.
    const storefrontBuildPath = path.join(__dirname, '..', 'storefront', 'dist');
    app.use(express.static(storefrontBuildPath));

    // 4. SERVIR O FRONTEND (BACKOFFICE) EM UM CAMINHO ESPECÍFICO (/app)
    const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'dist');
    app.use('/app', express.static(frontendBuildPath));
    app.get('/app/*', (req, res) => {
        res.sendFile(path.join(frontendBuildPath, 'index.html'));
    });

    // 5. Rota "catch-all" para o STOREFRONT em produção
    //    Esta rota deve vir DEPOIS de todas as outras rotas (API, /uploads, /app)
    app.get('*', (req, res) => {
        res.sendFile(path.join(storefrontBuildPath, 'index.html'), (err) => {
            if (err && err.status !== 404) {
                res.status(500).send(err);
            }
             // Para 404, não faz nada, deixa o SPA do storefront tratar
        });
    });

} else {
    console.log('Modo de desenvolvimento. Ficheiros estáticos do frontend NÃO estão a ser servidos pelo backend.');
    // Em desenvolvimento, o servidor Vite cuida do frontend.
    // Pode adicionar uma rota raiz simples para o backend, se desejar:
    app.get('/', (req, res) => {
      res.send('Servidor backend em execução. Aceda ao frontend React pela porta do Vite (ex: http://localhost:5173).');
    });
}
// --- FIM DA ALTERAÇÃO ---


// Conectar ao banco de dados
conectarBanco();

// Conexão WebSocket
io.on('connection', (socket) => {
  console.log('Um utilizador conectou-se via WebSocket:', socket.id);
  // Você pode adicionar lógica aqui para associar o socket a um usuário/role se necessário
  socket.on('disconnect', () => {
    console.log('O utilizador desconectou-se:', socket.id);
  });
});

// Middleware de tratamento de erros
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
  if (process.env.NODE_ENV !== 'production') {
      console.log(' Frontend React (Vite) deve estar a rodar separadamente (ex: http://localhost:5173)');
  }
});

// Código para encerramento gracioso
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
};

process.once('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Para nodemon
process.on('SIGINT', () => gracefulShutdown('SIGINT')); // Ctrl+C
process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // kill