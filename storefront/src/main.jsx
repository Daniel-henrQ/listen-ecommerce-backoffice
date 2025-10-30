// storefront/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// --- CORREÇÃO DE CAMINHOS ---
// Revertendo para caminhos relativos (./) que o Vite entende por padrão.
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

// --- CORREÇÃO DE IMPORTAÇÃO ---
// O CartProvider deve vir do 'CartContext.jsx', não do 'AuthContext.jsx'.
import { CartProvider } from './context/CartContext.jsx'; 
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider> {/* <<< Envolvendo o App */}
          <App />
        </CartProvider> {/* <<< Envolvendo o App */}
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);