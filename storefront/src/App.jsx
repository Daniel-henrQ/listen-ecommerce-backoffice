// storefront/src/App.jsx
import React, { useState, useEffect, useContext } from 'react'; // Adicionar useContext
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LiquidGlassSidebar from './components/LiquidGlassSidebar';
import AuthModal from './components/AuthModal';
import { AuthContext } from './context/AuthContext.jsx'; // Importar AuthContext
// Remover jwtDecode se não for mais usado aqui
// import { jwtDecode } from "jwt-decode";

function App() {
  const { user } = useContext(AuthContext); // Obter user do contexto
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  // Remover os estados locais: isAuthenticated, userName
  // const [isAuthenticated, setIsAuthenticated] = useState(false);
  // const [userName, setUserName] = useState('');

  // Remover a função checkAuth e o useEffect que a chamava
  /* const checkAuth = () => { ... }; */
  /* useEffect(() => { ... }, []); */

  const handleCloseSidebar = () => setIsSidebarOpen(false);

  const openAuthModal = () => {
    console.log("App.jsx (Storefront): Abrindo AuthModal...");
    setIsAuthModalOpen(true);
    document.body.classList.add('modal-open');
  };

  const closeAuthModal = () => {
    console.log("App.jsx (Storefront): Fechando AuthModal");
    setIsAuthModalOpen(false);
    document.body.classList.remove('modal-open');
    // Não precisa chamar checkAuth() aqui, o estado do contexto já foi atualizado pelo AuthModal/login
  };

  console.log("App.jsx (Storefront): Renderizando. AuthContext user:", user);

   // Mostrar loading enquanto o contexto verifica o token inicial
   if (user.isLoading) {
       return <div>A carregar aplicação...</div>; // Ou um spinner/layout básico
   }


  return (
    <Router>
      <div>
        {/* Passa o nome do utilizador do contexto para a Sidebar */}
        <LiquidGlassSidebar
          isOpen={isSidebarOpen}
          onClose={handleCloseSidebar}
          userName={user.name || 'Visitante'} // Usa o nome do contexto
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={closeAuthModal}
          // Não precisa passar `loginSuccess` se o modal usar o contexto diretamente
        />

        <main>
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  onOpenSidebar={() => setIsSidebarOpen(true)}
                  onOpenAuthModal={openAuthModal}
                  // Passa isAuthenticated e userName do contexto
                  isAuthenticated={user.isAuthenticated}
                  userName={user.name}
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