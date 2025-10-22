// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// Remova a importação do LoginPage
// import LoginPage from './pages/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import ProductsView from './pages/ProductsView';
import AdminView from './pages/AdminView';
import FornecedoresView from './pages/FornecedoresView';
import ComprasView from './pages/ComprasView';
import ClientesView from './pages/ClientesView';
import VendasView from './pages/VendasView';

// Componente PrivateRoute permanece o mesmo
const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('authToken');
    // Se não houver token, redireciona para o storefront (onde o modal de login aparecerá)
    return token ? children : <Navigate to="/" />; // ALTERADO: Redireciona para a raiz '/'
};

function App() {
    return (
        <Router>
            <Routes>
                {/* REMOVIDA a rota /login */}
                {/* <Route path="/login" element={<LoginPage />} /> */}

                <Route
                    path="/app"
                    element={
                        <PrivateRoute>
                            <DashboardLayout />
                        </PrivateRoute>
                    }
                >
                    {/* Rotas filhas do backoffice permanecem */}
                    <Route index element={<Navigate to="produtos" />} />
                    <Route path="produtos" element={<ProductsView />} />
                    <Route path="admin" element={<AdminView />} />
                    <Route path="fornecedor" element={<FornecedoresView />} />
                    <Route path="compras" element={<ComprasView />} />
                    <Route path="clientes" element={<ClientesView />} />
                    <Route path="vendas" element={<VendasView />} />
                </Route>

                 {/* Rota catch-all:
                     - Se houver token, tenta ir para /app (PrivateRoute decidirá).
                     - Se não houver token, redireciona para o storefront '/'.
                 */}
                <Route
                     path="*"
                     element={<Navigate to={localStorage.getItem('authToken') ? "/app" : "/"} />} // ALTERADO: Redireciona para '/' se não logado
                />
            </Routes>
        </Router>
    );
}

export default App;