// frontend/src/App.jsx
import React, { useContext } from 'react';
// REMOVA a prop 'basename' do BrowserRouter
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

// Layout principal do backoffice
import DashboardLayout from './layouts/DashboardLayout';

// Páginas... (imports existentes)
import ProductsView from './pages/ProductsView';
import AdminView from './pages/AdminView';
import FornecedoresView from './pages/FornecedoresView';
import ComprasView from './pages/ComprasView';
import ClientesView from './pages/ClientesView';
import VendasView from './pages/VendasView';

// --- Componente de rota protegida (mantido como antes) ---
const PrivateRoute = ({ children }) => {
  const { user } = useContext(AuthContext);

   if (user.isLoading) {
       return <div>A verificar autenticação...</div>;
   }

  if (user.isAuthenticated && (user.role === 'adm' || user.role === 'vendas')) {
    return children;
  } else {
    console.log("PrivateRoute (Frontend): Acesso negado. Redirecionando para storefront.", "Autenticado:", user.isAuthenticated, "Role:", user.role);
    window.location.href = '/';
    return null;
  }
};

// --- Aplicação principal ---
function App() {
  return (
    // <<< CORREÇÃO APLICADA AQUI: Remover basename >>>
    <BrowserRouter>
      <Routes>
        <Route
          path="/" // A rota pai agora é a raiz "/"
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          {/* As rotas filhas continuam relativas ao pai */}
          <Route index element={<Navigate to="produtos" replace />} />
          <Route path="produtos" element={<ProductsView />} />
          <Route path="admin" element={<AdminView />} />
          <Route path="fornecedor" element={<FornecedoresView />} />
          <Route path="compras" element={<ComprasView />} />
          <Route path="clientes" element={<ClientesView />} />
          <Route path="vendas" element={<VendasView />} />
          <Route path="*" element={<Navigate to="produtos" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;