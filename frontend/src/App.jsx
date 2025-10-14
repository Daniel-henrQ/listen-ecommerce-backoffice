import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import ProductsView from './pages/ProductsView';
import AdminView from './pages/AdminView';
import FornecedoresView from './pages/FornecedoresView';
//
// Componente para proteger rotas
const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('authToken');
    return token ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                    path="/app"
                    element={
                        <PrivateRoute>
                            <DashboardLayout />
                        </PrivateRoute>
                    }
                >
                    {/* Rotas filhas que serão renderizadas dentro do DashboardLayout */}
                    <Route index element={<Navigate to="produtos" />} />
                    <Route path="produtos" element={<ProductsView />} />
                    <Route path="admin" element={<AdminView />} />
                     <Route path="fornecedor" element={<FornecedoresView />} />
                    {/* Adicione outras rotas do dashboard aqui (clientes, vendas, etc.) */}
                </Route>
                {/* Redireciona a rota raiz para o login ou para a app se já estiver logado */}
                <Route path="*" element={<Navigate to={localStorage.getItem('authToken') ? "/app" : "/login"} />} />
            </Routes>
        </Router>
    );
}

export default App;