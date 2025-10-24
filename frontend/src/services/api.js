// frontend/src/services/api.js
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
      // Log 1: Confirma que o token está a ser lido E anexado
      console.log("[Request Interceptor] Token encontrado e anexado ao header para:", config.url);
    } else {
      // Log 2: Indica se não encontrou token para anexar
      console.warn("[Request Interceptor] Token NÃO encontrado no localStorage para:", config.url);
    }
    return config;
  },
  (error) => {
    // Trata erros potenciais ao configurar a requisição
     console.error("[Request Interceptor] Erro:", error);
    return Promise.reject(error);
  }
);

// --- MODIFICADO: Interceptor de Resposta com mais logging ---
api.interceptors.response.use(
  (response) => {
    // Se a resposta for bem-sucedida (status 2xx), apenas a retorna
    return response;
  },
  (error) => {
    // Verifica se o erro é de resposta e se o status é 401 (Não Autorizado) ou 403 (Proibido)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // **** ADICIONADO LOGGING DETALHADO ****
      console.error(
          `[Response Interceptor] ERRO ${error.response.status} DETETADO para URL: ${error.config.url}`, // Log 3: URL que falhou
          '\nMensagem do Backend:', error.response.data?.msg || '(Sem mensagem específica)', // Log 4: Mensagem da API
          '\nToken no localStorage NESTE MOMENTO:', localStorage.getItem('authToken'), // Log 5: O token ainda existe?
          '\nCabeçalho Authorization enviado:', error.config.headers?.Authorization ? 'SIM' : 'NÃO' // Log 6: O header foi enviado neste pedido específico?
      );
      // **** FIM DO LOGGING ADICIONADO ****

      // Remove o token inválido/expirado
      localStorage.removeItem('authToken');
      console.log("[Response Interceptor] Token removido do localStorage."); // Log 7

      // Redireciona o utilizador para a página inicial (storefront)
      console.log("[Response Interceptor] A redirecionar para '/'..."); // Log 8
      window.location.href = '/'; // Redireciona para a raiz do storefront
    }
    // Para outros erros, apenas rejeita a promise para que possam ser tratados localmente
    return Promise.reject(error);
  }
);
// --- FIM MODIFICADO ---


export default api;