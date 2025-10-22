import React, { useState } from 'react';
// Certifique-se de importar HomePage e LiquidGlassSidebar corretamente
import HomePage from './pages/HomePage'; // Ajuste o caminho se necessário
import LiquidGlassSidebar from './components/LiquidGlassSidebar'; // Ajuste o caminho

// Se estiver usando react-router-dom, a estrutura será um pouco diferente,
// mas a lógica de remover o marginLeft do container principal permanece.

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); //

  // A função handleCloseSidebar é passada para o LiquidGlassSidebar
  const handleCloseSidebar = () => setIsSidebarOpen(false); //

  return (
    <div>
      {/* GARANTIR QUE NÃO HÁ NENHUM BOTÃO "Abrir Menu" AQUI */}

      {/* Renderiza o Menu Lateral */}
      <LiquidGlassSidebar
        isOpen={isSidebarOpen} //
        onClose={handleCloseSidebar} //
        userName="Seu Nome" // Ou pegue dinamicamente
      />

      {/* Conteúdo Principal da Página (HomePage ou outras rotas) */}
      <main> {/* */}
        {/* Passa a função para abrir o sidebar para HomePage */}
        <HomePage onOpenSidebar={() => setIsSidebarOpen(true)} />
        {/* Outras páginas/rotas viriam aqui */}
      </main>
    </div>
  );
}

export default App;