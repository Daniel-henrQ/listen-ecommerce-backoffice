// storefront/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RockPage from './pages/RockPage';
import ProductDetailPage from './pages/ProductDetailPage';
// 1. Remova a importação do AuthProvider daqui
// import { AuthProvider } from './context/AuthContext'; 

function App() {
  return (
    // 2. Remova o AuthProvider que envolvia o Router
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/rock" element={<RockPage />} />
        <Route path="/produto/:id" element={<ProductDetailPage />} />
      </Routes>
    </Router>
  );
}

export default App;   