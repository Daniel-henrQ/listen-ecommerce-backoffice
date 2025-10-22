import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route /* ... */ } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LiquidGlassSidebar from './components/LiquidGlassSidebar';
import AuthModal from './components/AuthModal';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  // Não precisa mais de authModalView aqui, será controlado pelo AuthModal
  // const [authModalView, setAuthModalView] = useState('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    console.log("App.jsx: Verificando token...");
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);
    if (!token) {
      console.log("App.jsx: Token não encontrado. Abrindo modal de boas-vindas.");
      openAuthModal(); // Chama sem argumento para usar o default 'welcome'
    } else {
      console.log("App.jsx: Token encontrado.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCloseSidebar = () => setIsSidebarOpen(false);

  // Função openAuthModal agora pode receber a view desejada ('login' ou 'register')
  // Se não receber nada, o AuthModal usará 'welcome' como padrão.
  const openAuthModal = (view) => {
    console.log(`App.jsx: Chamando openAuthModal (view desejada: ${view || 'welcome'})`);
    // Passamos a view desejada para o AuthModal via props se necessário,
    // mas como o useEffect no AuthModal reseta para 'welcome',
    // só precisamos garantir que ele abra.
    // setAuthModalView(view || 'welcome'); // Não precisa mais definir a view aqui
    setIsAuthModalOpen(true);
    document.body.classList.add('modal-open');
  };


  const closeAuthModal = () => {
    console.log("App.jsx: Chamando closeAuthModal");
    setIsAuthModalOpen(false);
     document.body.classList.remove('modal-open');
     const token = localStorage.getItem('authToken');
     setIsAuthenticated(!!token);
  };

  console.log("App.jsx: Renderizando. isAuthModalOpen:", isAuthModalOpen);

  return (
    <Router>
      <div>
        <LiquidGlassSidebar
          isOpen={isSidebarOpen}
          onClose={handleCloseSidebar}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={closeAuthModal}
          // initialView não é mais necessário aqui, o AuthModal gerencia
        />

        <main>
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  onOpenSidebar={() => setIsSidebarOpen(true)}
                   onOpenAuthModal={openAuthModal} // Passa a função para abrir (pode especificar view)
                   isAuthenticated={isAuthenticated}
                />
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