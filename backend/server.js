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
    origin: "*", // Em produção, restrinja para o URL do seu frontend Vercel/Netlify/etc.
    methods: ["GET", "POST"]
  }
});

initNotificacaoService(io); // Inicializa o serviço de notificações com Socket.IO

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
app.use(cors()); // Permite requisições de diferentes origens (importante para dev com Vite)
app.use(express.json()); // Permite que o Express interprete JSON no corpo das requisições

// --- CONFIGURAÇÃO DAS ROTAS E ARQUIVOS ESTÁTICOS ---

// 1. ROTAS DA API (sempre com prefixo /api)
// Todas as requisições que começam com /api/... serão direcionadas para os roteadores específicos.
app.use('/api/produtos', produtoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notificacoes', notificacaoRoutes);
app.use('/api/fornecedores', fornecedorRoutes);
app.use('/api/compras', compraRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/vendas', vendaRoutes);
app.use('/api/relatorios', relatorioRoutes);

// 2. SERVIR ARQUIVOS DE UPLOAD (pasta /public/uploads)
// Permite acessar as imagens dos produtos via URL (ex: http://localhost:3000/uploads/nome_da_imagem.jpg)
const publicPath = path.join(__dirname, '..', 'public'); // Caminho para a pasta public
app.use('/uploads', express.static(path.join(publicPath, 'uploads')));

// --- SERVIR OS FRONTENDS ESTÁTICOS (APENAS EM PRODUÇÃO) ---
// Em desenvolvimento, o Vite serve os SPAs em suas próprias portas (ex: 5173, 5174)
if (process.env.NODE_ENV === 'production') {
    console.log('Modo de produção detetado. Servindo ficheiros estáticos...');

    // 3. SERVIR O FRONTEND (BACKOFFICE) a partir do caminho '/app'
    // Constrói o caminho para a pasta 'dist' do build do frontend
    const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'dist');
    // Serve os arquivos estáticos (JS, CSS, imagens) do backoffice quando a URL começa com /app
    // Ex: /app/assets/index-*.js será servido de frontend/dist/assets/index-*.js
    app.use('/app', express.static(frontendBuildPath));
    // Rota "catch-all" para o backoffice: Qualquer requisição para /app/* que não seja um arquivo estático
    // (ex: /app/produtos, /app/admin/usuarios) deve servir o index.html do backoffice.
    // Isso permite que o React Router (no frontend) controle a navegação interna do backoffice.
    app.get('/app/*', (req, res) => {
        res.sendFile(path.resolve(frontendBuildPath, 'index.html'));
    });

    // 4. SERVIR O STOREFRONT a partir da raiz '/'
    // Constrói o caminho para a pasta 'dist' do build do storefront
    const storefrontBuildPath = path.join(__dirname, '..', 'storefront', 'dist');
    // Serve os arquivos estáticos do storefront na raiz do servidor
    // Ex: /assets/index-*.js será servido de storefront/dist/assets/index-*.js
    app.use(express.static(storefrontBuildPath));

    // 5. ROTA "CATCH-ALL" PRINCIPAL para o STOREFRONT (Deve ser a ÚLTIMA rota)
    // Qualquer outra requisição que não corresponda à API (/api/*), aos uploads (/uploads/*)
    // ou ao backoffice (/app/*) deve servir o index.html do storefront.
    // Isso permite que o React Router (no storefront) controle a navegação do site principal.
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(storefrontBuildPath, 'index.html'));
    });

} else {
    // Modo de desenvolvimento: O backend não serve os arquivos do frontend.
    console.log('Modo de desenvolvimento. Os frontends (Vite) devem estar a rodar separadamente.');
    // Rota raiz apenas para indicar que o backend está online
    app.get('/', (req, res) => {
      res.send('Servidor backend em execução. Aceda aos frontends pelas portas do Vite.');
    });
}
// --- FIM DA CONFIGURAÇÃO ESTÁTICA ---


// Conectar ao banco de dados MongoDB
conectarBanco();

// Lógica de conexão do Socket.IO (mantida)
io.on('connection', (socket) => {
  console.log('Um utilizador conectou-se via WebSocket:', socket.id);
  // A lógica de associação usuário/role já está no notificacaoService.js (io.use)
  socket.on('disconnect', () => {
    console.log('O utilizador desconectou-se:', socket.id);
  });
});

// Middleware de tratamento de erros (deve ser o último 'use')
app.use((err, req, res, next) => {
  console.error("ERRO NÃO TRATADO:", err.stack || err.message); // Log detalhado do erro

  // Tratamento específico para erros do Multer (upload)
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ msg: `Erro no upload: ${err.message}` });
  }
  // Tratamento específico para erro de tipo de arquivo inválido (do filtro do Multer)
  if (err.message === 'Tipo de arquivo inválido.') {
    // 422 Unprocessable Entity é mais apropriado que 400 Bad Request aqui
    return res.status(422).json({ msg: err.message });
  }

  // Resposta de erro genérica para outros erros internos do servidor
  res.status(500).json({ msg: 'Ocorreu um erro interno no servidor.' });
});

// Iniciar o servidor HTTP (que inclui o Express e o Socket.IO)
server.listen(PORT, () => {
  console.log(` Servidor rodando em http://localhost:${PORT}`);
    if (process.env.NODE_ENV !== 'production') {
      console.log(' Lembre-se de iniciar os servidores Vite para o storefront e frontend separadamente (ex: portas 5173 e 5174).');
  }
});

// --- Código para encerramento gracioso (mantido) ---
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