// storefront/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js'; // Importa a instância configurada do Axios

// Cria o Contexto
export const AuthContext = createContext(null);

// Hook customizado para facilitar o uso do contexto
export const useAuth = () => {
    return useContext(AuthContext);
};

// Componente Provedor
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Armazena o objeto do usuário (cliente)
    const [token, setToken] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true); // Estado de carregamento inicial
    
    // Estado para o modal de autenticação (controlado globalmente)
    const [showAuthModal, setShowAuthModal] = useState(false);
    
    // Estado para erros de autenticação (para o modal)
    const [authError, setAuthError] = useState(null);

    // --- ESTADOS DE FAVORITOS ---
    const [favorites, setFavorites] = useState([]);

    // Efeito para carregar o token e o usuário do localStorage ao iniciar
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            try {
                const userObj = JSON.parse(storedUser);
                setUser(userObj);
                setToken(storedToken);
                setIsAuthenticated(true);
                // Configura o header do Axios para futuras requisições
                api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            } catch (error) {
                console.error("Erro ao parsear usuário do localStorage:", error);
                // Limpa se os dados estiverem corrompidos
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false); // Termina o carregamento inicial
    }, []);

    // Efeito para carregar favoritos quando o usuário é autenticado
    useEffect(() => {
        if (isAuthenticated && user) {
            // (Lógica para buscar favoritos da API pode ser adicionada aqui)
            // Por enquanto, podemos carregar do localStorage se existir
            const storedFavorites = localStorage.getItem(`favorites_${user._id}`);
            if (storedFavorites) {
                setFavorites(JSON.parse(storedFavorites));
            }
        } else {
            // Limpa os favoritos se o usuário deslogar
            setFavorites([]);
        }
    }, [isAuthenticated, user]);

    // Função de Login
    const login = async (loginData) => {
        try {
            // Chama o backend (certifique-se que o api.js está com a porta 3001)
            const response = await api.post('/auth/store/login', loginData);
            
            // Verificamos se o backend retornou o token E o usuário
            if (response.data.token && response.data.user) {
                
                // Configurações do Token
                api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
                localStorage.setItem('token', response.data.token);
                setToken(response.data.token);
                setIsAuthenticated(true);

                // --- CORREÇÃO ADICIONADA ---
                // 1. Salva o objeto do usuário no estado do React
                setUser(response.data.user);
                
                // 2. Salva o usuário no localStorage para persistir
                localStorage.setItem('user', JSON.stringify(response.data.user));
                // --- FIM DA CORREÇÃO ---

                console.log("Login bem-sucedido, token e usuário salvos.");
                setShowAuthModal(false); // Fechar o modal no sucesso
                setAuthError(null); // Limpar erros antigos
            } else {
                setAuthError(response.data.msg || 'Resposta inesperada.');
            }
        } catch (error) {
            console.error('Erro no login:', error.response ? error.response.data : error.message);
            // Mostra o erro vindo do backend (ex: "E-mail ou senha incorretos.")
            setAuthError(error.response?.data?.msg || 'E-mail ou senha incorretos.');
        }
    };

    // Função de Registro
    const register = async (registerData) => {
        try {
            const response = await api.post('/auth/store/register', registerData);
            
            // Verifica se o backend retornou o token E o usuário (fluxo de auto-login pós-registro)
            if (response.data.token && response.data.user) {
                
                // Configurações do Token
                api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
                localStorage.setItem('token', response.data.token);
                setToken(response.data.token);
                setIsAuthenticated(true);

                // Salva o usuário (igual ao login)
                setUser(response.data.user);
                localStorage.setItem('user', JSON.stringify(response.data.user));

                console.log("Registro bem-sucedido, usuário logado.");
                setShowAuthModal(false); // Fechar o modal no sucesso
                setAuthError(null); // Limpar erros antigos
            } else {
                setAuthError(response.data.msg || 'Resposta inesperada após registro.');
            }
        } catch (error) {
            console.error('Erro no registro:', error.response ? error.response.data : error.message);
            setAuthError(error.response?.data?.msg || 'Não foi possível criar a conta.');
        }
    };


    // Função de Logout
    const logout = () => {
        // Limpa o estado
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
        setFavorites([]); // Limpa favoritos do estado

        // Limpa o localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Remove o header de autorização do Axios
        delete api.defaults.headers.common['Authorization'];
        
        // Opcional: Limpar localStorage de favoritos (se você salvar por ID)
        if (user && user._id) {
             localStorage.removeItem(`favorites_${user._id}`);
        }
        
        console.log("Usuário deslogado.");
    };

    // --- FUNÇÕES DE FAVORITOS ---
    // (Estas funções são exemplos, ajuste conforme sua necessidade)

    // Adiciona um produto aos favoritos
    const addFavorito = (produto) => {
        if (!isAuthenticated || !user) {
            setShowAuthModal(true); // Pede login se tentar favoritar sem estar logado
            return;
        }
        
        // Evita duplicatas
        if (!favorites.find(fav => fav._id === produto._id)) {
            const newFavorites = [...favorites, produto];
            setFavorites(newFavorites);
            // Salva no localStorage associado ao usuário
            localStorage.setItem(`favorites_${user._id}`, JSON.stringify(newFavorites));
        }
    };

    // Remove um produto dos favoritos
    const removeFavorito = (produtoId) => {
        if (!isAuthenticated || !user) return;

        const newFavorites = favorites.filter(fav => fav._id !== produtoId);
        setFavorites(newFavorites);
        localStorage.setItem(`favorites_${user._id}`, JSON.stringify(newFavorites));
    };

    // Limpa todos os favoritos
    const clearFavoritos = () => {
         if (!isAuthenticated || !user) return;
         setFavorites([]);
         localStorage.removeItem(`favorites_${user._id}`);
    };


    // Valor fornecido pelo Provider
    const value = {
        user,
        token,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        
        // Estados e setters do Modal
        showAuthModal,
        setShowAuthModal,
        authError,
        setAuthError,

        // Estados e setters de Favoritos
        favorites,
        addFavorito,
        removeFavorito,
        clearFavoritos
    };

    // Retorna o Provider envolvendo os children (componentes filhos)
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};