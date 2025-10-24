import axios from 'axios';

const api = axios.create({
  baseURL: '/api' // O proxy do Vite vai redirecionar isto para http://localhost:3000/api
});

// Adiciona um "interceptor" que anexa o token a TODOS os pedidos
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("Token adicionado ao header Authorization."); // Log para depuração
    } else {
        console.warn("Token não encontrado para adicionar ao header.");
    }
    return config;
  },
  (error) => {
    // Trata erros potenciais ao configurar a requisição
     console.error("Erro no interceptor de requisição:", error);
    return Promise.reject(error);
  }
);

// --- NOVO: Interceptor de Resposta para tratar erros 401/403 ---
api.interceptors.response.use(
  (response) => {
    // Se a resposta for bem-sucedida (status 2xx), apenas a retorna
    return response;
  },
  (error) => {
    // Verifica se o erro é de resposta e se o status é 401 (Não Autorizado) ou 403 (Proibido)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.error(`Erro ${error.response.status}:`, error.response.data.msg || 'Acesso negado ou token inválido/expirado.');
      // Remove o token inválido/expirado
      localStorage.removeItem('authToken');
      // Redireciona o utilizador para a página inicial (storefront)
      // Usar window.location.href garante um redirecionamento completo fora do React Router do backoffice
      window.location.href = '/'; // Redireciona para a raiz do storefront
    }
    // Para outros erros, apenas rejeita a promise para que possam ser tratados localmente
    return Promise.reject(error);
  }
);
// --- FIM NOVO ---


export default api;