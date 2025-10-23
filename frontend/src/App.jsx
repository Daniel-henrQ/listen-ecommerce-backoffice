import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

// Layout principal do backoffice
import DashboardLayout from './layouts/DashboardLayout';

// Páginas do backoffice
import ProductsView from './pages/ProductsView';
import AdminView from './pages/AdminView';
import FornecedoresView from './pages/FornecedoresView';
import ComprasView from './pages/ComprasView';
import ClientesView from './pages/ClientesView';
import VendasView from './pages/VendasView';

// --- Componente de rota protegida ---
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('authToken');
  
  // Se não existir token, redireciona para a homepage
  if (!token) return <Navigate to="/" replace />;

  try {
    const decoded = jwtDecode(token);

    // Permite acesso apenas para funções internas
    if (decoded.role === 'adm' || decoded.role === 'vendas') {
      return children;
    } else {
      return <Navigate to="/" replace />;
    }
  } catch (error) {
    console.error('Token inválido ou expirado:', error);
    localStorage.removeItem('authToken');
    return <Navigate to="/" replace />;
  }
};

// --- Aplicação principal ---
function App() {
  return (
    // Define o prefixo das rotas do backoffice
    <BrowserRouter basename="/app">
      <Routes>
        {/* Área protegida do sistema */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          {/* Redireciona /app → /app/produtos */}
          <Route index element={<Navigate to="produtos" replace />} />

          {/* Rotas internas */}
          <Route path="produtos" element={<ProductsView />} />
          <Route path="admin" element={<AdminView />} />
          <Route path="fornecedor" element={<FornecedoresView />} />
          <Route path="compras" element={<ComprasView />} />
          <Route path="clientes" element={<ClientesView />} />
          <Route path="vendas" element={<VendasView />} />

          {/* Rota padrão para erros */}
          <Route path="*" element={<Navigate to="produtos" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
