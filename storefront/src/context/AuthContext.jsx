// storefront/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js'; // Instância configurada do Axios

// Cria o Contexto
export const AuthContext = createContext(null);

// Hook customizado para facilitar o uso do contexto
export const useAuth = () => {
  return useContext(AuthContext);
};

// Componente Provedor
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Armazena o objeto do usuário
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Estado para modal e erros de autenticação
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Estado de favoritos
  const [favorites, setFavorites] = useState([]);

  // Carrega token e usuário do localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const userObj = JSON.parse(storedUser);
        setUser(userObj);
        setToken(storedToken);
        setIsAuthenticated(true);
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      } catch (error) {
        console.error('Erro ao parsear usuário do localStorage:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Carrega favoritos quando autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      const storedFavorites = localStorage.getItem(`favorites_${user._id}`);
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } else {
      setFavorites([]);
    }
  }, [isAuthenticated, user]);

  // --- FUNÇÃO DE LOGIN ---
  const login = async (loginData) => {
  try {
    const response = await api.post('/auth/login', loginData);
    const { token, user } = response.data;

    if (token && user) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setToken(token);
      setUser(user);
      setIsAuthenticated(true);
      setAuthError(null);
      console.log('Login bem-sucedido');
      return { token, user };
    } else {
      setAuthError('Resposta inesperada do servidor.');
      return null;
    }
  } catch (error) {
    console.error('Erro no login:', error.response?.data || error.message);
    setAuthError(error.response?.data?.msg || 'Email ou senha inválidos.');
    throw error;
  }
};

  // --- FUNÇÃO DE REGISTRO ---
  const register = async (registerData) => {
    try {
      // Corrigido: remove o /api duplicado
      const response = await api.post('/auth/register', registerData);

      if (response.data.token && response.data.user) {
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        localStorage.setItem('token', response.data.token);
        setToken(response.data.token);
        setIsAuthenticated(true);

        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        console.log('Registro bem-sucedido, usuário logado.');
        setShowAuthModal(false);
        setAuthError(null);
      } else {
        setAuthError(response.data.msg || 'Resposta inesperada após registro.');
      }
    } catch (error) {
      console.error('Erro no registro:', error.response ? error.response.data : error.message);
      setAuthError(error.response?.data?.msg || 'Não foi possível criar a conta.');
    }
  };

  // --- FUNÇÃO DE LOGOUT ---
  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setFavorites([]);

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];

    if (user && user._id) {
      localStorage.removeItem(`favorites_${user._id}`);
    }

    console.log('Usuário deslogado.');
  };

  // --- FUNÇÕES DE FAVORITOS ---
  const addFavorito = (produto) => {
    if (!isAuthenticated || !user) {
      setShowAuthModal(true);
      return;
    }

    if (!favorites.find(fav => fav._id === produto._id)) {
      const newFavorites = [...favorites, produto];
      setFavorites(newFavorites);
      localStorage.setItem(`favorites_${user._id}`, JSON.stringify(newFavorites));
    }
  };

  const removeFavorito = (produtoId) => {
    if (!isAuthenticated || !user) return;

    const newFavorites = favorites.filter(fav => fav._id !== produtoId);
    setFavorites(newFavorites);
    localStorage.setItem(`favorites_${user._id}`, JSON.stringify(newFavorites));
  };

  const clearFavoritos = () => {
    if (!isAuthenticated || !user) return;
    setFavorites([]);
    localStorage.removeItem(`favorites_${user._id}`);
  };

  // --- VALOR DO CONTEXTO ---
  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    showAuthModal,
    setShowAuthModal,
    authError,
    setAuthError,
    favorites,
    addFavorito,
    removeFavorito,
    clearFavoritos,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
