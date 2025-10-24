// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    id: null,
    name: null,
    role: null,
    isAuthenticated: false,
    isLoading: true, // Começa como true para indicar que está a verificar o token inicial
  });

  const checkTokenValidity = useCallback(() => {
    console.log("AuthProvider: Verificando token...");
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp > currentTime) {
          console.log("AuthProvider: Token válido encontrado. Utilizador:", decoded.name, "Role:", decoded.role);
          setUser({
            id: decoded.id,
            name: decoded.name,
            role: decoded.role,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        } else {
          console.log("AuthProvider: Token expirado.");
          localStorage.removeItem('authToken');
        }
      } catch (error) {
        console.error("AuthProvider: Erro ao decodificar token:", error);
        localStorage.removeItem('authToken');
      }
    } else {
      console.log("AuthProvider: Nenhum token encontrado.");
    }

    // Se chegou aqui, não está autenticado
    setUser({
      id: null,
      name: null,
      role: null,
      isAuthenticated: false,
      isLoading: false, // Verificação concluída
    });
    return false;
  }, []);

  // Verificar token ao montar o componente
  useEffect(() => {
    checkTokenValidity();
  }, [checkTokenValidity]);

  // Função de Login
  const login = (token) => {
    console.log("AuthProvider: Efetuando login...");
    localStorage.setItem('authToken', token);
    checkTokenValidity(); // Revalida e atualiza o estado do utilizador
     // O redirecionamento será feito no componente que chamou o login (AuthModal)
  };

  // Função de Logout
  const logout = () => {
    console.log("AuthProvider: Efetuando logout...");
    localStorage.removeItem('authToken');
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
    <AuthContext.Provider value={{ user, login, logout }}>
      {/* Não renderiza children até que a verificação inicial do token esteja completa */}
      {!user.isLoading ? children : <div>A verificar autenticação...</div> /* Ou um spinner */}
    </AuthContext.Provider>
  );
};