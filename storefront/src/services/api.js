import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api', // URL base do seu backend
});

// Interceptor para adicionar o token de autenticação (se existir)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Funções de Autenticação de Cliente
export const registerCliente = (userData) => api.post('/clientes/register', userData);
export const loginCliente = (credentials) => api.post('/clientes/login', credentials);
export const getClienteData = (id) => api.get(`/clientes/${id}`);

// Funções de Produto
export const getProdutos = () => api.get('/produtos');
export const getProdutoById = (id) => api.get(`/produtos/${id}`);
export const getProdutosPorGenero = (genero) => api.get(`/produtos/genero/${genero}`);

// --- FUNÇÕES DE FAVORITOS (CORRIGIDAS) ---

// GET /api/clientes/favoritos/lista
export const getFavoritos = () => {
  // CORREÇÃO: A rota é '/clientes/favoritos/lista'
  return api.get('/clientes/favoritos/lista');
};

// POST /api/clientes/favoritos/add/:produtoId
export const addFavorito = (produtoId) => {
  // CORREÇÃO: A rota é '/clientes/favoritos/add/:produtoId'
  // (O segundo argumento {} é o body, que está vazio, o que é correto)
  return api.post(`/clientes/favoritos/add/${produtoId}`, {});
};

// DELETE /api/clientes/favoritos/remove/:produtoId
export const removeFavorito = (produtoId) => {
  // CORREÇÃO: A rota é '/clientes/favoritos/remove/:produtoId'
  return api.delete(`/clientes/favoritos/remove/${produtoId}`);
};

// --- FIM DAS FUNÇÕES DE FAVORITOS ---

export default api;