// storefront/src/App.jsx
import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LiquidGlassSidebar from './components/LiquidGlassSidebar'; //
import AuthModal from './components/AuthModal'; //
import { AuthContext } from './context/AuthContext.jsx'; //

function App() {
  const { user } = useContext(AuthContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  // ***** NOVO ESTADO: Controla se a abertura automática já foi feita/dispensada *****
  const [autoModalShownOrDismissed, setAutoModalShownOrDismissed] = useState(false);
  // ***** FIM DO NOVO ESTADO *****

  const handleCloseSidebar = () => setIsSidebarOpen(false);

  const openAuthModal = (initialView = 'login') => {
    // Só abre se não estiver autenticado E se o modal não estiver já aberto
    if (!isAuthModalOpen && !user.isAuthenticated) {
        console.log("App.jsx (Storefront): Abrindo AuthModal...");
        setIsAuthModalOpen(true);
        document.body.classList.add('modal-open');
    } else if (user.isAuthenticated) {
         console.log("App.jsx (Storefront): Tentativa de abrir AuthModal ignorada (utilizador já autenticado).");
    }
  };

  const closeAuthModal = () => {
    if (isAuthModalOpen) {
        console.log("App.jsx (Storefront): Fechando AuthModal manualmente.");
        setIsAuthModalOpen(false);
        // ***** ATUALIZAÇÃO: Marca que o modal foi dispensado nesta sessão *****
        setAutoModalShownOrDismissed(true);
        // ***** FIM DA ATUALIZAÇÃO *****
        document.body.classList.remove('modal-open');
    }
  };

  // useEffect para abrir o modal automaticamente
  useEffect(() => {
    // Abre o modal APENAS se:
    // 1. O carregamento inicial terminou
    // 2. O utilizador NÃO está autenticado
    // 3. O modal NÃO está aberto atualmente
    // 4. A abertura automática ainda NÃO ocorreu ou foi dispensada nesta sessão
    if (!user.isLoading && !user.isAuthenticated && !isAuthModalOpen && !autoModalShownOrDismissed) {
      console.log("App.jsx (Storefront): Usuário não autenticado após verificação. Abrindo AuthModal automaticamente...");
      openAuthModal('welcome');
      // ***** ATUALIZAÇÃO: Marca que a abertura automática ocorreu *****
      setAutoModalShownOrDismissed(true);
      // ***** FIM DA ATUALIZAÇÃO *****
    }
    // Adicionamos autoModalShownOrDismissed às dependências para reavaliar se necessário
  }, [user.isLoading, user.isAuthenticated, isAuthModalOpen, autoModalShownOrDismissed]);

  // useEffect para fechar o modal SE o utilizador fizer login (opcional, pode ser útil)
  useEffect(() => {
    if (isAuthModalOpen && user.isAuthenticated) {
        console.log("App.jsx (Storefront): Utilizador autenticado. Fechando AuthModal...");
        // Usar setIsAuthModalOpen diretamente aqui para não marcar como dispensado manualmente
        setIsAuthModalOpen(false);
        document.body.classList.remove('modal-open');
    }
  }, [isAuthModalOpen, user.isAuthenticated]); // Fechamento pós-login


  console.log("App.jsx (Storefront): Renderizando. AuthContext user:", user);

   if (user.isLoading) {
       return <div>A carregar aplicação...</div>;
   }

  return (
    <Router>
      <div>
        <LiquidGlassSidebar
          isOpen={isSidebarOpen}
          onClose={handleCloseSidebar}
          userName={user.name} //
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={closeAuthModal} // Permite o fecho manual
        />

        <main>
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  onOpenSidebar={() => setIsSidebarOpen(true)}
                  onOpenAuthModal={openAuthModal} // Permite a abertura manual pelo ícone (se deslogado)
                /> //
              }
            />
            {/* Outras rotas */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;