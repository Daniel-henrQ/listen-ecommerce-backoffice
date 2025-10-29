import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// Importa o hook que criámos
import { useAuth } from './context/AuthContext.jsx'; 

// Import Pages
import HomePage from './pages/HomePage.jsx';
import RockPage from './pages/RockPage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';

// Import Components
import LiquidGlassSidebar from './components/LiquidGlassSidebar.jsx';
import AuthModal from './components/AuthModal.jsx';

// Import CSS
import './App.css'; // O seu CSS global para o App

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // --- CORREÇÃO ---
  // Agora usamos o hook useAuth() que está a ser "provido" pelo main.jsx
  // Pegamos também o 'loading' para esperar o contexto ficar pronto
  const { user, loading, isAuthenticated } = useAuth(); 
  // --- FIM DA CORREÇÃO ---

  const handleOpenSidebar = () => setIsSidebarOpen(true);
  const handleCloseSidebar = () => setIsSidebarOpen(false);

  // --- ADIÇÃO ---
  // Se o contexto ainda estiver a verificar o token, 
  // mostramos um ecrã de carregamento.
  // Isto EVITA o erro 'Cannot read properties of null'
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        backgroundColor: '#111', 
        color: 'white',
        fontFamily: 'Arial, sans-serif'
      }}>
        Carregando...
      </div>
    );
  }
  // --- FIM DA ADIÇÃO ---

  return (
    // O <AuthProvider> foi REMOVIDO daqui.
    <Router>
      <LiquidGlassSidebar 
        isOpen={isSidebarOpen} 
        onClose={handleCloseSidebar} 
        // Passamos o 'user' (que pode ser null se não estiver logado)
        userName={user?.nome || 'Visitante'} 
      />
      
      {/* O AuthModal é controlado pelo estado global
          dentro do AuthContext */}
      <AuthModal /> 

      <Routes>
        {/* Passamos a função para a HomePage
            (como o seu código original já fazia) */}
        <Route path="/" element={<HomePage onOpenSidebar={handleOpenSidebar} />} />
        
        <Route path="/rock" element={<RockPage />} />
        <Route path="/produto/:id" element={<ProductDetailPage />} />
        
        {/* Adicione as outras rotas aqui */}
        {/* <Route path="/bossa-nova" element={<BossaNovaPage />} /> */}
        {/* <Route path="/jazz-blues" element={<JazzBluesPage />} /> */}
        {/* <Route path="/pop" element={<PopPage />} /> */}
      </Routes>
    </Router>
    // Esta linha (69) agora está correta, pois não há
    // um </AuthProvider> extra.
  ); 
}

export default App;
