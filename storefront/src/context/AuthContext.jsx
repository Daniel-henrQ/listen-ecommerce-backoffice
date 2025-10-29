// storefront/src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api'; // <-- ADICIONADO

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    id: null,
    name: null,
    role: null,
    isAuthenticated: false,
    isLoading: true, // Começa como true para indicar que está a verificar o token inicial
  });

  // --- NOVO ESTADO DE FAVORITOS ---
  const [favoritos, setFavoritos] = useState([]);

  // --- NOVAS FUNÇÕES DE FAVORITOS ---
  const fetchFavoritos = async () => {
    console.log("AuthProvider (Storefront): Buscando favoritos...");
    try {
        // O token já é injetado globalmente pelo 'api.js' ou pelo 'checkTokenValidity'
        const response = await api.get('/clientes/favoritos');
        setFavoritos(response.data); // O backend já popula os produtos
    } catch (error) {
        console.error('Erro ao buscar favoritos:', error);
        // Não desloga o usuário se falhar, apenas não carrega os favoritos
    }
  };

  const addFavorito = async (produtoId) => {
      try {
          await api.post('/clientes/favoritos', { produtoId });
          await fetchFavoritos(); // Recarrega a lista
      } catch (error) {
          console.error('Erro ao adicionar favorito:', error);
      }
  };

  const removeFavorito = async (produtoId) => {
      try {
          await api.delete(`/clientes/favoritos/${produtoId}`);
          // Atualização otimista para UI mais rápida
          setFavoritos(prev => prev.filter(p => p._id !== produtoId));
          // Poderia recarregar com fetchFavoritos() se preferir
      } catch (error) {
          console.error('Erro ao remover favorito:', error);
      }
  };
  
  const clearFavoritos = async () => {
      try {
          await api.delete('/clientes/favoritos');
          setFavoritos([]); // Limpa localmente
      } catch (error) {
          console.error('Erro ao limpar favoritos:', error);
      }
  };


  const checkTokenValidity = useCallback(() => {
    console.log("AuthProvider (Storefront): Verificando token..."); // Adicionado identificador
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        // Adiciona token ao 'api' (se api.js não fizer)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`; 

        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp > currentTime) {
          console.log("AuthProvider (Storefront): Token válido encontrado. Utilizador:", decoded.name, "Role:", decoded.role);
          setUser({
            id: decoded.id,
            name: decoded.name,
            role: decoded.role,
            isAuthenticated: true,
            isLoading: false,
          });
          fetchFavoritos(); // <-- ADICIONADO: Busca favoritos se o token for válido
          return true;
        } else {
          console.log("AuthProvider (Storefront): Token expirado.");
          localStorage.removeItem('authToken');
        }
      } catch (error) {
        console.error("AuthProvider (Storefront): Erro ao decodificar token:", error);
        localStorage.removeItem('authToken');
      }
    } else {
      console.log("AuthProvider (Storefront): Nenhum token encontrado.");
    }

    // Se chegou aqui, não está autenticado
    setUser({
      id: null,
      name: null,
      role: null,
      isAuthenticated: false,
      isLoading: false, // Verificação concluída
    });
    setFavoritos([]); // <-- ADICIONADO: Limpa favoritos se não autenticado
    return false;
  }, []);

  // Verificar token ao montar o componente
  useEffect(() => {
    checkTokenValidity();
  }, [checkTokenValidity]);

  // Função de Login
  const login = (token) => {
    console.log("AuthProvider (Storefront): Efetuando login...");
    localStorage.setItem('authToken', token);
    checkTokenValidity(); // Revalida e atualiza o estado do utilizador (que agora inclui fetchFavoritos)
     // O redirecionamento será feito no componente que chamou o login (AuthModal)
  };

  // Função de Logout
  const logout = () => {
    console.log("AuthProvider (Storefront): Efetuando logout...");
    localStorage.removeItem('authToken');
    api.defaults.headers.common['Authorization'] = null; // Limpa o header da api
    setFavoritos([]); // <-- ADICIONADO: Limpa favoritos
    setUser({
      id: null,
      name: null,
      role: null,
      isAuthenticated: false,
      isLoading: false,
    });
     // O redirecionamento será feito no componente que chamou o logout (Header, HomePage)
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        login, 
        logout,
        // --- ADICIONADO ---
        favoritos,
        addFavorito,
        removeFavorito,
        clearFavoritos
    }}>
      {/* Não renderiza children até que a verificação inicial do token esteja completa */}
      {!user.isLoading ? children : <div>A verificar autenticação...</div> /* Ou um spinner */}
    </AuthContext.Provider>
  );
};