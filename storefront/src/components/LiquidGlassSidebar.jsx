// storefront/src/components/LiquidGlassSidebar.jsx
import React, { useState } from 'react';
import styles from './LiquidGlassSidebar.module.css'; //

// Ícones SVG
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
// Define "Visitante" como valor padrão para userName se a prop for null ou undefined
function LiquidGlassSidebar({ isOpen, onClose, userName = "Visitante" }) {
  const [openSections, setOpenSections] = useState({
    discover: true,
    rock: false,
    jazzblues: false,
    bossanova: false,
    pop: false, // Adicionado baseado na imagem
  });

  const toggleSection = (sectionName) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  const handleSidebarClick = (e) => e.stopPropagation();

  return (
    <>
      {/* Overlay */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.showOverlay : ''}`} //
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${isOpen ? styles.open : ''}`} //
        onClick={handleSidebarClick}
        aria-hidden={!isOpen}
       >
        {/* Cabeçalho */}
        <div className={styles.sidebarHeader}> {/* */}
          <div className={styles.userInfo}> {/* */}
            {/* Usa o valor da prop userName (que será "Visitante" se não logado) */}
            <span className={styles.greeting}>Olá, {userName}</span> {/* */}
          </div>
          <button className={styles.closeButton} onClick={onClose} aria-label="Fechar menu"> {/* */}
            <CloseIcon />
          </button>
        </div>

        {/* Seção Descubra */}
        <div className={styles.discoverSection}> {/* */}
          <button className={styles.sectionHeader} onClick={() => toggleSection('discover')} aria-expanded={openSections.discover}> {/* */}
            <h2 className={styles.discoverTitle}>Descubra a Listen.</h2> {/* */}
            <span className={`${styles.arrowIcon} ${openSections.discover ? styles.arrowOpen : ''}`}> {/* */}
                <ChevronDownIcon />
            </span>
          </button>
          <div className={`${styles.collapsibleContent} ${openSections.discover ? styles.contentOpen : ''}`}> {/* */}
            <p className={styles.discoverText}> {/* */}
              Mais que uma loja de discos, um espaço para sentir a música. Cada disco é uma história, cada gênero tem seu ritmo - do rock intenso, cheio de atitudes, ao punk. Valorizamos o charme analógico, exploramos sons com textura, celebramos a beleza imperfeita. Listen, um lugar único.
            </p>
          </div>
        </div>

        {/* Navegação Principal */}
        <nav className={styles.navigation}> {/* */}
          {/* Seção Rock */}
          <div className={styles.navSection}> {/* */}
            <button className={styles.sectionHeader} onClick={() => toggleSection('rock')} aria-expanded={openSections.rock}> {/* */}
              <span className={styles.sectionTitle}>Rock</span> {/* */}
              <span className={`${styles.arrowIcon} ${openSections.rock ? styles.arrowOpen : ''}`}> {/* */}
                <ChevronDownIcon />
              </span>
            </button>
            <ul className={`${styles.subLinks} ${openSections.rock ? styles.subLinksOpen : ''}`}> {/* */}
              <li><a href="#" className={styles.subLink}>Hard Rock</a></li> {/* */}
              <li><a href="#" className={styles.subLink}>Punk Rock</a></li> {/* */}
              <li><a href="#" className={styles.subLink}>Alternativo</a></li> {/* */}
            </ul>
          </div>

          {/* Seção Jazz&Blues */}
          <div className={styles.navSection}> {/* */}
            <button className={styles.sectionHeader} onClick={() => toggleSection('jazzblues')} aria-expanded={openSections.jazzblues}> {/* */}
              <span className={styles.sectionTitle}>Jazz&Blues</span> {/* */}
              <span className={`${styles.arrowIcon} ${openSections.jazzblues ? styles.arrowOpen : ''}`}> {/* */}
                 <ChevronDownIcon />
              </span>
            </button>
             <ul className={`${styles.subLinks} ${openSections.jazzblues ? styles.subLinksOpen : ''}`}> {/* */}
              <li><a href="#" className={styles.subLink}>Classic Jazz</a></li> {/* */}
              <li><a href="#" className={styles.subLink}>Delta Blues</a></li> {/* */}
            </ul>
          </div>

          {/* Seção Bossa Nova */}
           <div className={styles.navSection}> {/* */}
            <button className={styles.sectionHeader} onClick={() => toggleSection('bossanova')} aria-expanded={openSections.bossanova}> {/* */}
              <span className={styles.sectionTitle}>Bossa Nova</span> {/* */}
              <span className={`${styles.arrowIcon} ${openSections.bossanova ? styles.arrowOpen : ''}`}> {/* */}
                 <ChevronDownIcon />
              </span>
            </button>
             <ul className={`${styles.subLinks} ${openSections.bossanova ? styles.subLinksOpen : ''}`}> {/* */}
                 <li><a href="#" className={styles.subLink}>Clássicos</a></li> {/* */}
            </ul>
          </div>

          {/* Seção Pop */}
          <div className={styles.navSection}> {/* */}
            <button className={styles.sectionHeader} onClick={() => toggleSection('pop')} aria-expanded={openSections.pop}> {/* */}
              <span className={styles.sectionTitle}>Pop</span> {/* */}
              <span className={`${styles.arrowIcon} ${openSections.pop ? styles.arrowOpen : ''}`}> {/* */}
                <ChevronDownIcon />
              </span>
            </button>
            <ul className={`${styles.subLinks} ${openSections.pop ? styles.subLinksOpen : ''}`}> {/* */}
                <li><a href="#" className={styles.subLink}>Pop Hits</a></li> {/* */}
            </ul>
          </div>

        </nav>
      </aside>
    </>
  );
}

export default LiquidGlassSidebar;