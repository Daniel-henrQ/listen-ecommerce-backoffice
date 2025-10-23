// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

// Layout principal do backoffice
import DashboardLayout from './layouts/DashboardLayout';

// Páginas do backoffice -- <<< ADICIONAR ESTAS LINHAS >>> ---
import ProductsView from './pages/ProductsView';
import AdminView from './pages/AdminView';
import FornecedoresView from './pages/FornecedoresView';
import ComprasView from './pages/ComprasView';
import ClientesView from './pages/ClientesView';
import VendasView from './pages/VendasView';
// --- <<< FIM DAS ADIÇÕES >>> ---

// --- Componente de rota protegida ---
const PrivateRoute = ({ children }) => {
  // Verificar se está em modo de desenvolvimento
  const isDevelopment = import.meta.env.DEV;

  // Se estiver em desenvolvimento, permite o acesso direto
  if (isDevelopment) {
    console.warn("MODO DEV: Verificação de token no PrivateRoute desativada.");
    return children;
  }

  // Lógica original para produção (ou se quiser testar auth em dev)
  const token = localStorage.getItem('authToken');
  if (!token) return <Navigate to="/" replace />; // Redireciona para storefront se não houver token

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    // Verifica expiração E se a role é válida para o backoffice
    if (decoded.exp > currentTime && (decoded.role === 'adm' || decoded.role === 'vendas')) {
      return children;
    } else {
      console.error("Token expirado ou role inválida:", decoded.role);
      localStorage.removeItem('authToken');
      return <Navigate to="/" replace />; // Redireciona para storefront
    }
  } catch (error) {
    console.error('Token inválido:', error);
    localStorage.removeItem('authToken');
    return <Navigate to="/" replace />; // Redireciona para storefront
  }
};

// --- Aplicação principal ---
function App() {
  return (
    // Define o prefixo das rotas do backoffice COM BARRA NO FINAL
    <BrowserRouter basename="/app/"> {/* << CORREÇÃO APLICADA AQUI */}
      <Routes>
        <Route
          path="/"
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          {/* Rota inicial redireciona para 'produtos' */}
          <Route index element={<Navigate to="produtos" replace />} />
          {/* Rotas das páginas */}
          <Route path="produtos" element={<ProductsView />} />
          <Route path="admin" element={<AdminView />} />
          <Route path="fornecedor" element={<FornecedoresView />} />
          <Route path="compras" element={<ComprasView />} />
          <Route path="clientes" element={<ClientesView />} />
          <Route path="vendas" element={<VendasView />} />
          {/* Rota "catch-all" redireciona para 'produtos' */}
          <Route path="*" element={<Navigate to="produtos" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;