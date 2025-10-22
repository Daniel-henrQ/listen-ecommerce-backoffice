// frontend/src/App.jsx
import React from 'react';
// --- AJUSTE AQUI ---
// Importe BrowserRouter e renomeie para Router, ou use diretamente BrowserRouter
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// --- FIM DO AJUSTE ---
import DashboardLayout from './layouts/DashboardLayout'; // Layout principal do backoffice
// Importa as diferentes visualizações (páginas) do backoffice
import ProductsView from './pages/ProductsView';
import AdminView from './pages/AdminView';
import FornecedoresView from './pages/FornecedoresView';
import ComprasView from './pages/ComprasView';
import ClientesView from './pages/ClientesView';
import VendasView from './pages/VendasView';
import { jwtDecode } from 'jwt-decode'; // Para decodificar o token JWT

// Componente PrivateRoute (mantido como antes)
const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        return <Navigate to="/" replace />; // Redireciona para storefront se não houver token
    }
    try {
        const decoded = jwtDecode(token);
        if (decoded.role === 'adm' || decoded.role === 'vendas') {
            return children; // Permite acesso se for funcionário
        } else {
            return <Navigate to="/" replace />; // Redireciona para storefront se for cliente
        }
    } catch (error) {
        console.error("Token inválido ou expirado:", error);
        localStorage.removeItem('authToken');
        return <Navigate to="/" replace />; // Redireciona para storefront se token inválido
    }
};

// Componente principal da aplicação do Backoffice
function App() {
    return (
        // --- AJUSTE AQUI ---
        // Adicione a propriedade basename="/app" ao BrowserRouter
        <BrowserRouter basename="/app">
        {/* --- FIM DO AJUSTE --- */}
            <Routes>
                {/* Rota principal protegida para o backoffice */}
                {/* O path aqui continua '/', pois o basename já cuida do prefixo /app */}
                <Route
                    path="/"
                    element={
                        <PrivateRoute>
                            <DashboardLayout />
                        </PrivateRoute>
                    }
                >
                    {/* Rota Index: Redireciona de '/' (relativo ao basename) para 'produtos' */}
                    {/* O destino agora é relativo ao basename */}
                    <Route index element={<Navigate to="produtos" replace />} />

                    {/* Rotas filhas do backoffice */}
                    {/* Os paths são relativos ao path pai ('/') */}
                    <Route path="produtos" element={<ProductsView />} />
                    <Route path="admin" element={<AdminView />} />
                    <Route path="fornecedor" element={<FornecedoresView />} />
                    <Route path="compras" element={<ComprasView />} />
                    <Route path="clientes" element={<ClientesView />} />
                    <Route path="vendas" element={<VendasView />} />

                    {/* Catch-all DENTRO do backoffice: Redireciona rotas inválidas para 'produtos' */}
                    {/* O destino também é relativo */}
                    <Route path="*" element={<Navigate to="produtos" replace />} />
                </Route>

                {/* Rotas fora do backoffice não são necessárias aqui */}

            </Routes>
        </BrowserRouter> // Fechar BrowserRouter
    );
}

export default App;