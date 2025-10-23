// frontend/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api' // O proxy do Vite vai redirecionar isto para http://localhost:3000/api
});

// Adiciona um "interceptor" que anexa o token a todos os pedidos, EXCETO em desenvolvimento
api.interceptors.request.use(
  (config) => {
    // Verifica se NÃO está em modo de desenvolvimento
    if (!import.meta.env.DEV) {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log("PROD Mode: Token adicionado ao header."); // Log para depuração
        } else {
            console.warn("PROD Mode: Token não encontrado para adicionar ao header.");
        }
    } else {
        // Em modo DEV, não adiciona o header Authorization
        console.warn("MODO DEV: Header Authorization NÃO será adicionado.");
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;