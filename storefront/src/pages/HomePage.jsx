// storefront/src/pages/HomePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import '../assets/css/HomePage.css';
import { jwtDecode } from "jwt-decode"; 

const logoWhitePath = '/listen-white.svg';
const logoDarkPath = '/listen.svg';

// Recebe as props: onOpenSidebar, onOpenAuthModal, isAuthenticated
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
            let userRole = null;
            let userName = 'Utilizador';
            const token = localStorage.getItem('authToken');
            if (token) {
                try {
                    // Usar jwt-decode para extrair informações do token
                    const decoded = jwtDecode(token);
                    userRole = decoded.role;
                    userName = decoded.name; // Pega o nome do token
                } catch (e) {
                    console.error("Erro ao descodificar token:", e);
                    // Opcional: Deslogar se o token for inválido?
                    // localStorage.removeItem('authToken');
                    // window.location.reload();
                }
            }

            // Ação de Logout
            const handleLogout = () => {
                localStorage.removeItem('authToken');
                window.location.reload(); // Recarrega a página para atualizar o estado
            };

            if (userRole === 'adm' || userRole === 'vendas') {
                // Funcionário: Link para o backoffice + botão Sair
                return (
                    <>
                        <a href="/app" title="Acessar Backoffice" className="menu-btn" style={{ textDecoration: 'none' }}>
                            <span className="material-symbols-outlined">admin_panel_settings</span>
                            BACKOFFICE
                        </a>
                        <button className="menu-btn" onClick={handleLogout}>SAIR</button>
                    </>
                );
            } else {
                // Cliente: Ícone de conta + botão Sair
                return (
                    <>
                        <a href="#" title={`Conta de ${userName}`} className="menu-btn" onClick={(e) => { e.preventDefault(); alert('Página Minha Conta (Cliente) - Não implementado.'); }}>
                            <span className="material-symbols-outlined">account_circle</span>
                            {/* Opcional: Mostrar nome do cliente */}
                            {/* {userName.split(' ')[0]} */}
                        </a>
                        <button className="menu-btn" onClick={handleLogout}>SAIR</button>
                    </>
                );
            }
        } else {
            // Não Autenticado: Botões Entrar/Criar Conta
            return (
                <>
                    <button className="menu-btn" onClick={() => onOpenAuthModal('login')}>
                        ENTRAR
                    </button>
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
                            {/* Adicionar botão de submit ao formulário do newsletter */}
                             <button type="submit" className="newsletter-button" style={{ /* Estilos básicos */ padding: '10px 15px', marginTop: '10px', cursor: 'pointer', background: '#333', color: '#fff', border: 'none', borderRadius: '4px' }}>Inscrever</button>
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