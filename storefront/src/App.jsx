import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RockPage from './pages/RockPage';
// 1. Importe a nova página
import ProductDetailPage from './pages/ProductDetailPage'; 
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/rock" element={<RockPage />} />
          {/* 2. Adicione a rota para a nova página */}
          <Route path="/produto/:id" element={<ProductDetailPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;