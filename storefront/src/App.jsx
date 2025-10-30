import React, { useState } from 'react';
// --- CORREÇÃO DE IMPORTAÇÃO ---
// Removemos o 'BrowserRouter as Router' daqui, pois ele já existe no main.jsx
import { Routes, Route } from 'react-router-dom';
// Importa o hook que criámos
import { useAuth } from './context/AuthContext.jsx'; 

// Import Pages
import HomePage from './pages/HomePage.jsx';
import RockPage from './pages/RockPage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import BossaNovaPage from './pages/BossaNovaPage.jsx';
import JazzBluesPage from './pages/JazzBluesPage.jsx'; // <-- ADICIONADO
import CartPage from './pages/CartPage.jsx';

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
    // --- CORREÇÃO ---
    // Removemos o <Router> que envolvia todo o componente.
    // Usamos um Fragment (<>) para agrupar os elementos.
    <>
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
        <Route path="/bossa-nova" element={<BossaNovaPage />} />
        <Route path="/jazz-blues" element={<JazzBluesPage />} /> {/* <-- ADICIONADO */}
        
        <Route path="/produto/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
      </Routes>
    </>
    // --- FIM DA CORREÇÃO ---
  ); 
}

export default App;