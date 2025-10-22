// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// Não importa mais o LoginPage
import DashboardLayout from './layouts/DashboardLayout';
import ProductsView from './pages/ProductsView';
import AdminView from './pages/AdminView';
import FornecedoresView from './pages/FornecedoresView';
import ComprasView from './pages/ComprasView';
import ClientesView from './pages/ClientesView';
import VendasView from './pages/VendasView';
import { jwtDecode } from 'jwt-decode'; // Importar jwt-decode

// Componente PrivateRoute atualizado para verificar o papel
const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        // Se não há token, redireciona para o storefront
        return <Navigate to="/" />;
    }
    try {
        const decoded = jwtDecode(token);
        // Verifica se o papel é de funcionário (adm ou vendas)
        if (decoded.role === 'adm' || decoded.role === 'vendas') {
            return children; // Permite acesso ao backoffice
        } else {
            // Se for cliente ou outro papel, redireciona para o storefront
            return <Navigate to="/" />;
        }
    } catch (error) {
        // Se o token for inválido, remove e redireciona para o storefront
        console.error("Token inválido:", error);
        localStorage.removeItem('authToken');
        return <Navigate to="/" />;
    }
};

function App() {
    return (
        <Router>
            <Routes>
                {/* A rota /login foi removida */}

                {/* Rota protegida para o backoffice (/app) */}
                <Route
                    path="/app"
                    element={
                        <PrivateRoute>
                            <DashboardLayout />
                        </PrivateRoute>
                    }
                >
                    {/* Rota Index: Redireciona de /app para /app/produtos */}
                    <Route index element={<Navigate to="produtos" />} />

                    {/* Rotas filhas do backoffice */}
                    <Route path="produtos" element={<ProductsView />} />
                    <Route path="admin" element={<AdminView />} />
                    <Route path="fornecedor" element={<FornecedoresView />} />
                    <Route path="compras" element={<ComprasView />} />
                    <Route path="clientes" element={<ClientesView />} />
                    <Route path="vendas" element={<VendasView />} />

                    {/* Catch-all DENTRO de /app: Se nenhuma rota filha corresponder, redireciona para /app/produtos */}
                    <Route path="*" element={<Navigate to="/app/produtos" />} />
                </Route>

                {/* Rota catch-all GERAL:
                    - Se nenhuma rota acima corresponder (nem /app nem suas filhas),
                      redireciona para o storefront ('/').
                 */}
                <Route
                     path="*"
                     element={<Navigate to="/" />}
                />
            </Routes>
        </Router>
    );
}

export default App;