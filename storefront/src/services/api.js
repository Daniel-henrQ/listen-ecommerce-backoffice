import axios from 'axios';

// Define a URL base da sua API (backend)
// Se o seu backend (server.js) está rodando na porta 3000
const API_URL = 'http://localhost:3000/api'; 

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para adicionar o token de autenticação, se existir
// Isso será útil para quando o cliente fizer login
api.interceptors.request.use(async (config) => {
  // O token do 'storefront' pode ser salvo com um nome diferente,
  // mas 'token' é o padrão que você usa no AuthContext.jsx.
  const token = localStorage.getItem('token'); 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;