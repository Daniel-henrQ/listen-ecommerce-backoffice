import React, { useState } from 'react';
import styles from './LiquidGlassSidebar.module.css'; // Importa os estilos CSS Module

// Ícones SVG simples (você pode substituir por uma biblioteca como react-icons)
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);

// --- Componente Principal ---
function LiquidGlassSidebar({ isOpen, onClose, userName = "Bernardo" }) {
  // Estado para controlar quais seções estão abertas
  const [openSections, setOpenSections] = useState({
    discover: true, // Começa aberta como na imagem
    rock: false,
    jazzblues: false,
    bossanova: false,
  
  });

  // Função para abrir/fechar uma seção
  const toggleSection = (sectionName) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  // Previne o fechamento do menu ao clicar dentro dele
  const handleSidebarClick = (e) => {
      e.stopPropagation();
  }

  return (
    <>
      {/* Overlay para fechar ao clicar fora */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.showOverlay : ''}`}
        onClick={onClose} // Fecha ao clicar no overlay
      ></div>

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}
        onClick={handleSidebarClick} // Impede que cliques dentro fechem
        aria-hidden={!isOpen}
       >
        {/* Cabeçalho */}
        <div className={styles.sidebarHeader}>
          <div className={styles.userInfo}>
            {/* Adicionar imagem de perfil aqui se necessário */}
            <span className={styles.greeting}>Olá, {userName}</span>
          </div>
          <button className={styles.closeButton} onClick={onClose} aria-label="Fechar menu">
            <CloseIcon />
          </button>
        </div>

        {/* Seção Descubra */}
        <div className={styles.discoverSection}>
          <button className={styles.sectionHeader} onClick={() => toggleSection('discover')} aria-expanded={openSections.discover}>
            <h2 className={styles.discoverTitle}>Descubra a Listen.</h2>
            <span className={`${styles.arrowIcon} ${openSections.discover ? styles.arrowOpen : ''}`}>
                <ChevronDownIcon /> {/* Ícone será rotacionado via CSS */}
            </span>
          </button>
          <div className={`${styles.collapsibleContent} ${openSections.discover ? styles.contentOpen : ''}`}>
            <p className={styles.discoverText}>
              Mais que uma loja de discos, um espaço para sentir a música. Cada disco é uma história, cada gênero tem seu ritmo - do rock intenso, cheio de atitudes, ao punk. Valorizamos o charme analógico, exploramos sons com textura, celebramos a beleza imperfeita. Listen, um lugar único.
            </p>
          </div>
        </div>

        {/* Navegação Principal */}
        <nav className={styles.navigation}>
          {/* Seção Rock */}
          <div className={styles.navSection}>
            <button className={styles.sectionHeader} onClick={() => toggleSection('rock')} aria-expanded={openSections.rock}>
              <span className={styles.sectionTitle}>Rock</span>
              <span className={`${styles.arrowIcon} ${openSections.rock ? styles.arrowOpen : ''}`}>
                <ChevronDownIcon />
              </span>
            </button>
            <ul className={`${styles.subLinks} ${openSections.rock ? styles.subLinksOpen : ''}`}>
              <li><a href="#" className={styles.subLink}>Hard Rock</a></li>
              <li><a href="#" className={styles.subLink}>Punk Rock</a></li>
              <li><a href="#" className={styles.subLink}>Alternativo</a></li>
              {/* Adicione mais sublinks */}
            </ul>
          </div>

          {/* Seção Jazz&Blues */}
          <div className={styles.navSection}>
            <button className={styles.sectionHeader} onClick={() => toggleSection('jazzblues')} aria-expanded={openSections.jazzblues}>
              <span className={styles.sectionTitle}>Jazz&Blues</span>
              <span className={`${styles.arrowIcon} ${openSections.jazzblues ? styles.arrowOpen : ''}`}>
                 <ChevronDownIcon />
              </span>
            </button>
             <ul className={`${styles.subLinks} ${openSections.jazzblues ? styles.subLinksOpen : ''}`}>
              <li><a href="#" className={styles.subLink}>Classic Jazz</a></li>
              <li><a href="#" className={styles.subLink}>Delta Blues</a></li>
              {/* Adicione mais sublinks */}
            </ul>
          </div>

          {/* Seção Bossa Nova */}
           <div className={styles.navSection}>
            <button className={styles.sectionHeader} onClick={() => toggleSection('bossanova')} aria-expanded={openSections.bossanova}>
              <span className={styles.sectionTitle}>Bossa Nova</span>
              <span className={`${styles.arrowIcon} ${openSections.bossanova ? styles.arrowOpen : ''}`}>
                 <ChevronDownIcon />
              </span>
            </button>
             <ul className={`${styles.subLinks} ${openSections.bossanova ? styles.subLinksOpen : ''}`}>
                 <li><a href="#" className={styles.subLink}>Clássicos</a></li>
                 {/* Adicione mais sublinks */}
            </ul>
          </div>

       

        </nav>
      </aside>
    </>
  );
}

export default LiquidGlassSidebar;