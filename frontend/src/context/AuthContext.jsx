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
     isLoading: true, // Começa como true
   });

   // *** NOVO useEffect para ler o token da URL ***
   useEffect(() => {
     console.log("AuthProvider (Frontend): Verificando token na URL...");
     const urlParams = new URLSearchParams(window.location.search);
     const tokenFromUrl = urlParams.get('token');

     if (tokenFromUrl) {
       console.log("AuthProvider (Frontend): Token encontrado na URL. Guardando no localStorage...");
       // Guarda o token no localStorage desta origem (backoffice)
       localStorage.setItem('authToken', tokenFromUrl);

       // Limpa o token da URL da barra de endereço do navegador
       window.history.replaceState({}, document.title, window.location.pathname);
       console.log("AuthProvider (Frontend): Token removido da URL.");

       // Agora que o token está no localStorage, chama a validação
       checkTokenValidity();
     } else {
       // Se não encontrou token na URL, verifica o localStorage como antes
       checkTokenValidity();
     }
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []); // Array vazio intencional para executar SÓ na montagem inicial
   // *** FIM do NOVO useEffect ***

   const checkTokenValidity = useCallback(() => {
     console.log("AuthProvider (Frontend): Verificando token no localStorage...");
     const token = localStorage.getItem('authToken');
     if (token) {
       try {
         const decoded = jwtDecode(token);
         const currentTime = Date.now() / 1000;

         if (decoded.exp > currentTime) {
           console.log("AuthProvider (Frontend): Token válido encontrado. Utilizador:", decoded.name, "Role:", decoded.role);
           setUser({
             id: decoded.id,
             name: decoded.name,
             role: decoded.role,
             isAuthenticated: true,
             isLoading: false, // Verificação concluída com sucesso
           });
           return true;
         } else {
           console.log("AuthProvider (Frontend): Token expirado.");
           localStorage.removeItem('authToken');
         }
       } catch (error) {
         console.error("AuthProvider (Frontend): Erro ao decodificar token:", error);
         localStorage.removeItem('authToken');
       }
     } else {
       console.log("AuthProvider (Frontend): Nenhum token encontrado no localStorage.");
     }

     // Se chegou aqui, não está autenticado ou o token é inválido/expirado
     setUser({
       id: null,
       name: null,
       role: null,
       isAuthenticated: false,
       isLoading: false, // Verificação concluída (sem sucesso)
     });
     return false;
   }, []);

   // A função login é chamada pelo AuthModal do Storefront, não aqui diretamente no fluxo inicial
   const login = (token) => {
     console.log("AuthProvider (Frontend): Função login chamada (pode ser desnecessário após redirecionamento)...");
     localStorage.setItem('authToken', token);
     checkTokenValidity(); // Revalida e atualiza o estado
   };

   // A função logout permanece igual
   const logout = () => {
     console.log("AuthProvider (Frontend): Efetuando logout...");
     localStorage.removeItem('authToken');
     setUser({
       id: null,
       name: null,
       role: null,
       isAuthenticated: false,
       isLoading: false,
     });
      // O redirecionamento será tratado pelo PrivateRoute ou pelo interceptor da API
   };

   return (
     <AuthContext.Provider value={{ user, login, logout }}>
       {/* Não renderiza children até que a verificação inicial (URL ou localStorage) esteja completa */}
       {!user.isLoading ? children : <div>A verificar autenticação...</div> /* Ou um spinner */}
     </AuthContext.Provider>
   );
 };