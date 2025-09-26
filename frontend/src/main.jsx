import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './assets/css/variables-reset.css';
import './assets/css/main-layout.css';
import './assets/css/components.css';
import './assets/css/responsive.css';
import './assets/css/login.css'; // Adicione o CSS do login também
//
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)