// storefront/src/App.jsx
import React, { useState, useEffect } from 'react';
// <<< GARANTIR que é BrowserRouter e NÃO HashRouter >>>
import { BrowserRouter as Router, Routes, Route /* ... */ } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LiquidGlassSidebar from './components/LiquidGlassSidebar';
import AuthModal from './components/AuthModal';
import { jwtDecode } from "jwt-decode"; // Importar jwt-decode

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState(''); // Estado para o nome do utilizador

  // Função para verificar autenticação e buscar nome do utilizador
  const checkAuth = () => {
    console.log("App.jsx (Storefront): Verificando token...");
    const token = localStorage.getItem('authToken');
    if (token) {
        try {
            const decoded = jwtDecode(token);
            const currentTime = Date.now() / 1000;
            if (decoded.exp > currentTime) {
                setIsAuthenticated(true);
                setUserName(decoded.name || 'Utilizador'); // Define o nome do utilizador
                console.log("App.jsx (Storefront): Token válido encontrado. Utilizador:", decoded.name);
                return true; // Token válido
            } else {
                console.log("App.jsx (Storefront): Token expirado.");
                localStorage.removeItem('authToken'); // Limpa token expirado
            }
        } catch (e) {
            console.error("App.jsx (Storefront): Erro ao decodificar token:", e);
            localStorage.removeItem('authToken'); // Limpa token inválido
        }
    }
    // Se chegou aqui, não está autenticado
    setIsAuthenticated(false);
    setUserName('');
    console.log("App.jsx (Storefront): Token não encontrado ou inválido.");
    return false; // Não autenticado
  };


  useEffect(() => {
    const authenticated = checkAuth(); // Verifica ao carregar
    if (!authenticated) {
      // Decide se abre o modal automaticamente SÓ se não estiver autenticado
      // openAuthModal(); // Comente ou remova esta linha se não quiser abrir automaticamente
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executa apenas uma vez ao montar

  const handleCloseSidebar = () => setIsSidebarOpen(false);

  // Função para abrir o modal de autenticação
  const openAuthModal = (view) => {
    console.log(`App.jsx (Storefront): Abrindo AuthModal (view: ${view || 'welcome'})`);
    setIsAuthModalOpen(true);
    document.body.classList.add('modal-open');
  };

  // Função para fechar o modal e re-verificar autenticação
  const closeAuthModal = () => {
    console.log("App.jsx (Storefront): Fechando AuthModal");
    setIsAuthModalOpen(false);
    document.body.classList.remove('modal-open');
    checkAuth(); // Re-verifica o estado de autenticação após fechar (login/logout pode ter ocorrido)
  };

  console.log("App.jsx (Storefront): Renderizando. isAuthModalOpen:", isAuthModalOpen, "isAuthenticated:", isAuthenticated);

  return (
    // <<< GARANTIR que NÃO HÁ basename aqui >>>
    <Router>
      <div>
        {/* Passa o nome do utilizador para a Sidebar */}
        <LiquidGlassSidebar
          isOpen={isSidebarOpen}
          onClose={handleCloseSidebar}
          userName={userName} // Passa o nome do utilizador
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={closeAuthModal}
        />

        <main>
          <Routes>
            <Route
              path="/" // Rota raiz
              element={
                <HomePage
                  onOpenSidebar={() => setIsSidebarOpen(true)}
                  onOpenAuthModal={openAuthModal}
                  isAuthenticated={isAuthenticated}
                  // userName={userName} // Pode passar o nome para HomePage também se necessário
                />
              }
            />
            {/* Outras rotas do storefront aqui */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;