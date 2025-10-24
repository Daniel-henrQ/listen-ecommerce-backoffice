// frontend/src/App.jsx
import React, { useContext, useEffect } from 'react'; // Remova useState, useEffect já estava importado
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
// Importe as suas páginas
import ProductsView from './pages/ProductsView';
import AdminView from './pages/AdminView';
import FornecedoresView from './pages/FornecedoresView';
import ComprasView from './pages/ComprasView';
import ClientesView from './pages/ClientesView';
import VendasView from './pages/VendasView';


// --- Componente de rota protegida REVISADO ---
const PrivateRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  console.log("PrivateRoute: Verificando estado do user:", JSON.stringify(user));

  // Efeito para lidar com o redirecionamento QUANDO o user NÃO está autenticado
  useEffect(() => {
    // Só executa se o carregamento inicial terminou E o user NÃO está autenticado
    if (!user.isLoading && !user.isAuthenticated) {
      console.log("PrivateRoute [useEffect]: Acesso negado. Redirecionando para '/'...");
      window.location.href = '/'; // Inicia o redirecionamento
    }
    // A dependência [user.isLoading, user.isAuthenticated] garante que este efeito
    // re-execute se o estado de autenticação mudar após o carregamento inicial.
  }, [user.isLoading, user.isAuthenticated]);

  // 1. Enquanto o AuthContext está a verificar o token inicial, mostra loading
  if (user.isLoading) {
    console.log("PrivateRoute: AuthContext ainda está a carregar.");
    return <div>A verificar autenticação...</div>; // Ou um spinner
  }

  // 2. Se autenticado e com role correta, permite acesso
  //    Verifica também se o role existe no objeto user antes de aceder
  if (user.isAuthenticated && user.role && (user.role === 'adm' || user.role === 'vendas')) {
    console.log("PrivateRoute: Acesso permitido.");
    return children; // Renderiza o conteúdo protegido (DashboardLayout)
  }

  // 3. Se não estiver autenticado (e já não estiver a carregar), o useEffect acima tratará
  //    do redirecionamento. Retorna null para não renderizar nada enquanto isso.
  //    Se o role for inválido (ex: cliente tentando aceder), também cairá aqui.
  console.log("PrivateRoute: Aguardando redirecionamento via useEffect ou acesso inválido.");
  return null; // Não renderiza nada enquanto o useEffect não redireciona
};

// --- Aplicação principal (sem alterações no Router) ---
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/" // Rota pai continua a ser a raiz
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          {/* As rotas filhas continuam relativas */}
          <Route index element={<Navigate to="produtos" replace />} />
          <Route path="produtos" element={<ProductsView />} />
          <Route path="admin" element={<AdminView />} />
          <Route path="fornecedor" element={<FornecedoresView />} />
          <Route path="compras" element={<ComprasView />} />
          <Route path="clientes" element={<ClientesView />} />
          <Route path="vendas" element={<VendasView />} />
          {/* Rota catch-all dentro do backoffice, redireciona para produtos */}
          <Route path="*" element={<Navigate to="produtos" replace />} />
        </Route>
        {/* Adicione outras rotas públicas fora do PrivateRoute se necessário */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;