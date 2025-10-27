// storefront/src/App.jsx
import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RockPage from './pages/RockPage'; // <-- Import the new page
import LiquidGlassSidebar from './components/LiquidGlassSidebar';
import AuthModal from './components/AuthModal';
import { AuthContext } from './context/AuthContext.jsx';

function App() {
  const { user } = useContext(AuthContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // ... (rest of the App component logic: handlers, etc.) ...
  const handleCloseSidebar = () => setIsSidebarOpen(false);
  const openAuthModal = () => { /* ... */ setIsAuthModalOpen(true); document.body.classList.add('modal-open'); };
  const closeAuthModal = () => { /* ... */ setIsAuthModalOpen(false); document.body.classList.remove('modal-open'); };

  if (user.isLoading) {
     return <div>A carregar aplicação...</div>;
  }

  return (
    <Router>
      <div>
        {/* Pass the correct handlers and state to components that need them */}
        <LiquidGlassSidebar
          isOpen={isSidebarOpen}
          onClose={handleCloseSidebar}
          userName={user.name || 'Visitante'}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={closeAuthModal}
        />

        <main> {/* Wrap routes in main or appropriate layout tag */}
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  onOpenSidebar={() => setIsSidebarOpen(true)}
                  onOpenAuthModal={openAuthModal}
                  isAuthenticated={user.isAuthenticated}
                  // userName prop might not be needed if HomePage uses context too
                />
              }
            />
            {/* --- ADD THE NEW ROUTE --- */}
            <Route path="/rock" element={<RockPage />} />
            {/* Add routes for /jazz-blues and /bossa-nova later */}
            {/* ------------------------- */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;