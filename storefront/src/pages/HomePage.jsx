// storefront/src/pages/HomePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import '../assets/css/HomePage.css';
// Não precisa mais importar LiquidGlassSidebar aqui

const logoWhitePath = '/listen-white.svg';
const logoDarkPath = '/listen.svg';

// Recebe as novas props: onOpenAuthModal e isAuthenticated
function HomePage({ onOpenSidebar, onOpenAuthModal, isAuthenticated }) {
    const [isNavSticky, setIsNavSticky] = useState(false);
    const mainNavRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
             setIsNavSticky(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Função para renderizar os botões de autenticação ou perfil
     const renderAuthSection = () => {
         if (isAuthenticated) {
             // Exemplo: Mostrar um ícone de perfil logado
             // Você pode expandir isso para um dropdown de usuário se necessário
             return (
                  <a href="/app" title="Minha Conta Backoffice" target="_blank" rel="noopener noreferrer"> {/* Link para backoffice */}
                      <span className="material-symbols-outlined">account_circle</span>
                  </a>
             );
         } else {
             // Mostrar botões de Entrar/Criar Conta
             return (
                 <>
                     {/* Botão/Link para abrir modal de Login */}
                     <button className="menu-btn" onClick={() => onOpenAuthModal('login')}>
                         ENTRAR
                     </button>
                     {/* Botão/Link para abrir modal de Cadastro */}
                     <button className="menu-btn" onClick={() => onOpenAuthModal('register')}>
                         CRIAR CONTA
                     </button>
                 </>
             );
         }
     };

    return (
        <>
            <header className="hero-section">
                {/* ... Video Background ... */}
                <div className="video-background">
                    <video src="/Minimalist_Vinyl_Record_Video_Generation.mp4" autoPlay muted loop playsInline></video>
                    <div className="video-overlay"></div>
                </div>

                <nav ref={mainNavRef} className={`main-nav ${isNavSticky ? 'nav-is-sticky' : ''}`}>
                    <div className="nav-left">
                        <button className="menu-btn" onClick={onOpenSidebar}>
                            <span className="material-symbols-outlined">menu</span>
                            MENU
                        </button>
                        {/* A barra de pesquisa pode permanecer */}
                        <div className="search-bar">
                             <span className="material-symbols-outlined">search</span>
                             <input type="search" placeholder="Search" />
                        </div>
                    </div>

                    <div className="nav-center">
                         <div className="logo-container">
                            <img src={isNavSticky ? logoDarkPath : logoWhitePath} alt="Listen." className="logo-svg" />
                         </div>
                    </div>

                    <div className="nav-right">
                        {/* Ícones existentes */}
                        <a href="#" title="Localização"><span className="material-symbols-outlined">location_on</span></a>
                        <a href="#" title="Favoritos"><span className="material-symbols-outlined">favorite</span></a>
                        <a href="#" title="Carrinho"><span className="material-symbols-outlined">shopping_cart</span></a>

                        {/* Seção de Autenticação/Perfil */}
                        {renderAuthSection()}

                    </div>
                </nav>
            </header>

             {/* ... Restante do conteúdo da HomePage (main, footer) ... */}
              <main>
                <section className="about-us">
                    <h2>A listen.</h2>
                    <p>Ouvir um vinil é um ritual. É tirar o disco da capa com cuidado, colocar na vitrola, ouvir os estalos antes da primeira nota. É presença. É tempo. É arte que gira. A listen. nasceu desse sentimento.</p>
                    <p>Não somos apenas uma loja. Somos um lugar que entende que a música tem textura, tem cheiro, tem peso. Que o design pode mudar de forma conforme o som muda de tom. Que o rock pede contraste, o jazz pede elegância, e a bossa nova dança em sutileza. Aqui, cada gênero tem espaço para ser o que é, sem se encaixar em moldes. Do clean ao punk, sem esforço.</p>
                    <p>Criamos a listen. porque acreditamos que estética importa. Mas sentimento importa mais. Se você coleciona discos porque cada um carrega uma história, está no lugar certo. Se você enxerga beleza no que é imperfeito, analógico, real seja bem-vindo. A gente compartilha do mesmo som.</p>
                </section>
            </main>
             <footer>
                 {/* ... conteúdo do footer ... */}
                 <div className="footer-container">
                    <div className="footer-column">
                        <h3>Junte-se a nós</h3>
                        <p>Cadastre seu e-mail e receba 50% de desconto na primeira compra</p>
                        <form className="newsletter-form">
                            <input type="text" placeholder="Nome" />
                            <input type="email" placeholder="E-mail" />
                        </form>
                    </div>
                    <div className="footer-column">
                        <h3>Categorias</h3>
                        <ul>
                            <li><a href="#">Rock</a></li>
                            <li><a href="#">Bossa nova</a></li>
                            <li><a href="#">Jazz e Blues</a></li>
                        </ul>
                    </div>
                    <div className="footer-column">
                        <h3>Contato</h3>
                        <p>(19) 3590-000</p>
                        <p>E-mail: faleconosco@listen.com.br</p>
                    </div>
                </div>
             </footer>
        </>
    );
}

export default HomePage;