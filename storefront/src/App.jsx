// storefront/src/App.jsx
import React, { useState, useContext } from 'react'; // 1. Importar hooks
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RockPage from './pages/RockPage';
import ProductDetailPage from './pages/ProductDetailPage';

// 2. Importar os componentes de overlay
import LiquidGlassSidebar from './components/LiquidGlassSidebar.jsx';
// 3. Assumindo que o seu modal de autenticação se chama AuthModal.jsx
import AuthModal from './components/AuthModal.jsx'; 
import { AuthContext } from './context/AuthContext.jsx'; // 4. Importar o contexto

function App() {
  // 5. Gerir o estado do sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // 6. Gerir o estado do modal de autenticação
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState('login'); // Ex: 'login' ou 'register'
  
  // 7. Obter dados do usuário para passar ao sidebar
  const { user } = useContext(AuthContext);

  // 8. Criar os handlers (funções para abrir/fechar)
  const handleOpenSidebar = () => setIsSidebarOpen(true);
  const handleCloseSidebar = () => setIsSidebarOpen(false);
  
  const handleOpenAuthModal = (view) => {
    setAuthModalView(view);
    setIsAuthModalOpen(true);
  };
  const handleCloseAuthModal = () => setIsAuthModalOpen(false);

  return (
    <Router>
      {/* 9. Renderizar o Sidebar fora das Rotas, para ser global */}
      <LiquidGlassSidebar 
        isOpen={isSidebarOpen} 
        onClose={handleCloseSidebar}
        userName={user.isAuthenticated ? user.name : "Visitante"} 
      />
      
      {/* 10. Renderizar o Modal de Autenticação (ajuste as props conforme necessário) */}
      {isAuthModalOpen && (
        <AuthModal 
          isOpen={isAuthModalOpen}
          onClose={handleCloseAuthModal}
          initialView={authModalView}
        />
      )}

      {/* 11. Configurar as rotas e passar os handlers para a HomePage */}
      <Routes>
        <Route 
          path="/" 
          element={<HomePage 
            onOpenSidebar={handleOpenSidebar} 
            onOpenAuthModal={handleOpenAuthModal}
          />} 
        />
        <Route path="/rock" element={<RockPage />} />
        <Route path="/produto/:id" element={<ProductDetailPage />} />
      </Routes>
    </Router>
  );
}

export default App;