const mongoose = require('mongoose');
require('dotenv').config();

// Ativa modo strictQuery para evitar avisos futuros
mongoose.set('strictQuery', true);

// Busca credenciais do .env
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD; // ✅ CORRIGIDO: de DB_PASS para DB_PASSWORD
const dbCluster = process.env.DB_CLUSTER;
const dbName = process.env.DB_NAME;

//Monta a URI usando as variáveis do .env
const uri = `mongodb+srv://${dbUser}:${dbPassword}@${dbCluster}/${dbName}?retryWrites=true&w=majority`;

// Função assíncrona para conectar ao MongoDB
// backend/config.js
async function conectarBanco() {
  try {
    await mongoose.connect(uri);
    console.log('Conectou ao banco de dados com sucesso!');
  } catch (error) {
    console.error('ERRO CRÍTICO na conexão com o banco:', error.message);
    process.exit(1); // <-- Adicione esta linha para terminar o processo
  }
}
//
module.exports = conectarBanco;