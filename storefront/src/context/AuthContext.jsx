import React, { createContext, useState, useEffect, useContext } from 'react';
// CORREÇÃO: Importar os nomes corretos da API
import { loginCliente, registerCliente, getFavoritos, addFavorito, removeFavorito } from '../services/api'; 
import { jwtDecode } from 'jwt-decode'; // É necessário: npm install jwt-decode

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false); 

  // --- ADICIONADO: Estado de Favoritos ---
  const [favorites, setFavorites] = useState([]);
  // --- FIM DA ADIÇÃO ---

  // --- ADICIONADO: Função para buscar favoritos ---
  const fetchFavoritos = async (currentToken) => {
    console.log("AuthProvider (Storefront): Buscando favoritos...");
    try {
      // Usa a função 'getFavoritos' corrigida da api.js
      const response = await getFavoritos(currentToken); 
      setFavorites(response.data);
    } catch (error) {
      console.error("Erro ao buscar favoritos:", error);
      if (error.response && error.response.status === 401) {
        logout(); // Desloga se o token for inválido
      }
    }
  };
  // --- FIM DA ADIÇÃO ---

  useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem('token');
      console.log("AuthProvider (Storefront): Verificando token...");
      if (storedToken) {
        try {
          const decodedToken = jwtDecode(storedToken);
          const currentTime = Date.now() / 1000;
          
          if (decodedToken.exp < currentTime) {
            console.log("AuthProvider (Storefront): Token expirado.");
            logout();
          } else {
            setToken(storedToken);
            setUser({
              // Garante que pega o ID, mesmo que esteja aninhado
              id: decodedToken.id || (decodedToken.user ? decodedToken.user.id : null), 
              nome: decodedToken.nome,
              role: decodedToken.role,
            });
            console.log(`AuthProvider (Storefront): Token válido encontrado. Utilizador: ${decodedToken.nome} Role: ${decodedToken.role}`);
            
            // --- ADICIONADO: Buscar favoritos após validar token ---
            await fetchFavoritos(storedToken);
            // --- FIM DA ADIÇÃO ---
          }
        } catch (error) {
          console.error("AuthProvider (Storefront): Token inválido.", error);
          logout(); 
        }
      }
      setLoading(false);
    };

    validateToken();
  }, []); // Dependência vazia, roda apenas uma vez

  const login = async (email, password) => {
    try {
      // O seu AuthModal provavelmente passa 'password'. Se for 'senha', mude aqui.
      const response = await loginCliente({ email, senha: password }); 
      const { token } = response.data; // Pega o token da resposta
      
      localStorage.setItem('token', token);
      const decodedToken = jwtDecode(token);
      
      setToken(token);
      setUser({
        id: decodedToken.id || (decodedToken.user ? decodedToken.user.id : null),
        nome: decodedToken.nome,
        role: decodedToken.role,
      });
      
      // --- ADICIONADO: Buscar favoritos após login ---
      await fetchFavoritos(token);
      // --- FIM DA ADIÇÃO ---

      setShowAuthModal(false); 
    } catch (error) {
      console.error('Erro no login:', error);
      throw error; 
    }
  };

  const register = async (userData) => {
    try {
      // O seu controller 'criarCliente' espera estes campos.
      await registerCliente(userData);
      
      setShowAuthModal(false); 
      alert("Registro bem-sucedido! Por favor, faça o login.");

    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log("AuthProvider (Storefront): Deslogando...");
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    // --- ADICIONADO: Limpar favoritos no logout ---
    setFavorites([]);
    // --- FIM DA ADIÇÃO ---
  };

  // --- FUNÇÕES DE FAVORITOS (CORRIGIDAS) ---
  const handleAddFavorite = async (produtoId) => {
    if (!token) return; 
    try {
      // Usa a função 'addFavorito' (com 'o') da api.js
      const response = await addFavorito(produtoId);
      setFavorites(response.data); // Atualiza o estado
    } catch (error) {
      console.error("Erro ao adicionar favorito", error);
    }
  };

  const handleRemoveFavorite = async (produtoId) => {
    if (!token) return; 
    try {
      // Usa a função 'removeFavorito' (com 'o') da api.js
      const response = await removeFavorito(produtoId);
      setFavorites(response.data); // Atualiza o estado
    } catch (error) {
      console.error("Erro ao remover favorito", error);
    }
  };
  // --- FIM DA CORREÇÃO ---

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        register,
        logout,
        showAuthModal,
        setShowAuthModal,
        // --- CORRIGIDO: Exportando os nomes corretos ('addFavorite' com 'e') ---
        favorites,
        addFavorite: handleAddFavorite,    // <-- Exporta como 'addFavorite'
        removeFavorite: handleRemoveFavorite // <-- Exporta como 'removeFavorite'
        // --- FIM DA CORREÇÃO ---
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);