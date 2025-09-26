import axios from 'axios';

const api = axios.create({
  baseURL: '/api' // O proxy do Vite vai redirecionar isto para http://localhost:3000/api
});
//
// Adiciona um "interceptor" que anexa o token a todos os pedidos
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;