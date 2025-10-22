import React, { useState } from 'react';
// Certifique-se de importar HomePage e LiquidGlassSidebar corretamente
import HomePage from './pages/HomePage'; // Ajuste o caminho se necessário
import LiquidGlassSidebar from './components/LiquidGlassSidebar'; // Ajuste o caminho

// Se estiver usando react-router-dom, a estrutura será um pouco diferente,
// mas a lógica de remover o marginLeft do container principal permanece.

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleOpenSidebar = () => setIsSidebarOpen(true);
  const handleCloseSidebar = () => setIsSidebarOpen(false);

  return (
    <div>
      {/* Botão para abrir o menu pode estar em um Header fixo ou na HomePage */}
      {/* Exemplo de botão (ajuste conforme seu layout): */}
      <button
        onClick={handleOpenSidebar}
        style={{
          position: 'fixed', // Ou 'absolute' dependendo do seu header
          top: '20px',
          left: '20px',
          zIndex: 1001, // Garante que fique acima de algum conteúdo, mas abaixo do menu aberto
          padding: '10px',
          background: '#eee',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Abrir Menu
      </button>

      {/* Renderiza o Menu Lateral */}
      <LiquidGlassSidebar
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        userName="Seu Nome" // Ou pegue dinamicamente
      />

      {/* Conteúdo Principal da Página (HomePage ou outras rotas) */}
      {/* REMOVA QUALQUER ESTILO 'marginLeft' DAQUI */}
      <main>
        {/* Se estiver usando Router, aqui viriam suas <Routes> */}
        <HomePage />
        {/* Outras páginas/rotas viriam aqui */}
      </main>
    </div>
  );
}

export default App;