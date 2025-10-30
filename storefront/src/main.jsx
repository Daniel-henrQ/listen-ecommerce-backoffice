// storefront/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/AuthContext.jsx'; // <<< IMPORTE O NOVO PROVIDER
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider> {/* <<< ADICIONE AQUI */}
          <App />
        </CartProvider> {/* <<< ADICIONE AQUI */}
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);