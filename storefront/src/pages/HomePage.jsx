import React, { useState, useEffect, useRef } from 'react';
import '../assets/css/HomePage.css'; // Importa o CSS adaptado
import LiquidGlassSidebar from '../components/LiquidGlassSidebar'; // Ajuste o caminho se necessário

const logoWhitePath = '/listen-white.svg'; // Ou .png
const logoDarkPath = '/listen.svg';      // Ou .png

// Recebe a prop onOpenSidebar vinda do App.jsx
function HomePage({ onOpenSidebar }) {
    // Estados isSidebarOpen e handleCloseSidebar são gerenciados pelo App.jsx agora
    // Mantemos isNavSticky e mainNavRef locais
    const [isNavSticky, setIsNavSticky] = useState(false); //
    const mainNavRef = useRef(null); //

    // O useEffect para o scroll permanece o mesmo
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) { //
                setIsNavSticky(true); //
            } else {
                setIsNavSticky(false); //
            }
        };
        window.addEventListener('scroll', handleScroll); //
        return () => {
            window.removeEventListener('scroll', handleScroll); //
        };
    }, []);

    return (
        <>
            {/* O LiquidGlassSidebar é renderizado no App.jsx */}
            {/* <LiquidGlassSidebar ... /> */}

            <header className="hero-section"> {/* */}
                <div className="video-background"> {/* */}
                    <video src="/Minimalist_Vinyl_Record_Video_Generation.mp4" autoPlay muted loop playsInline></video> {/* */}
                    <div className="video-overlay"></div> {/* */}
                </div>

                <nav ref={mainNavRef} className={`main-nav ${isNavSticky ? 'nav-is-sticky' : ''}`}> {/* */}
                    <div className="nav-left"> {/* */}
                        {/* Botão que abre o menu - USA A PROP onOpenSidebar */}
                        <button className="menu-btn" onClick={onOpenSidebar}> {/* Usa a prop aqui */}
                            <span className="material-symbols-outlined">menu</span> {/* */}
                            MENU {/* */}
                        </button>
                        <div className="search-bar"> {/* */}
                            <span className="material-symbols-outlined">search</span> {/* */}
                            <input type="search" placeholder="Search" /> {/* */}
                        </div>
                    </div>

                    <div className="nav-center"> {/* */}
                        <div className="logo-container"> {/* */}
                            <img src={isNavSticky ? logoDarkPath : logoWhitePath} alt="Listen." className="logo-svg" /> {/* */}
                        </div>
                    </div>

                    <div className="nav-right"> {/* */}
                        <a href="#" title="Localização"> {/* */}
                            <span className="material-symbols-outlined">location_on</span> {/* */}
                        </a>
                        <div className="user-account"> {/* */}
                            <a href="#" title="Minha Conta"> {/* */}
                                <span className="material-symbols-outlined">person</span> {/* */}
                            </a>
                            <ul className="dropdown-menu"> {/* */}
                                <li><a href="#">Meus pedidos</a></li> {/* */}
                                <li><a href="#">Meus dados</a></li> {/* */}
                                <li><a href="#">Fale Conosco</a></li> {/* */}
                                <li><a href="#">Proteção de dados</a></li> {/* */}
                                <li><a href="#">Cancelamento</a></li> {/* */}
                            </ul>
                        </div>
                        <a href="#" title="Favoritos"> {/* */}
                            <span className="material-symbols-outlined">favorite</span> {/* */}
                        </a>
                        <a href="#" title="Carrinho"> {/* */}
                            <span className="material-symbols-outlined">shopping_cart</span> {/* */}
                        </a>
                    </div>
                </nav>
            </header>

            <main>
                <section className="about-us"> {/* */}
                    <h2>A listen.</h2> {/* */}
                    <p>Ouvir um vinil é um ritual. É tirar o disco da capa com cuidado, colocar na vitrola, ouvir os estalos antes da primeira nota. É presença. É tempo. É arte que gira. A listen. nasceu desse sentimento.</p> {/* */}
                    <p>Não somos apenas uma loja. Somos um lugar que entende que a música tem textura, tem cheiro, tem peso. Que o design pode mudar de forma conforme o som muda de tom. Que o rock pede contraste, o jazz pede elegância, e a bossa nova dança em sutileza. Aqui, cada gênero tem espaço para ser o que é, sem se encaixar em moldes. Do clean ao punk, sem esforço.</p> {/* */}
                    <p>Criamos a listen. porque acreditamos que estética importa. Mas sentimento importa mais. Se você coleciona discos porque cada um carrega uma história, está no lugar certo. Se você enxerga beleza no que é imperfeito, analógico, real seja bem-vindo. A gente compartilha do mesmo som.</p> {/* */}
                </section>
            </main>

            <footer> {/* */}
                <div className="footer-container"> {/* */}
                    <div className="footer-column"> {/* */}
                        <h3>Junte-se a nós</h3> {/* */}
                        <p>Cadastre seu e-mail e receba 50% de desconto na primeira compra</p> {/* */}
                        <form className="newsletter-form"> {/* */}
                            <input type="text" placeholder="Nome" /> {/* */}
                            <input type="email" placeholder="E-mail" /> {/* */}
                        </form>
                    </div>
                    <div className="footer-column"> {/* */}
                        <h3>Categorias</h3> {/* */}
                        <ul> {/* */}
                            <li><a href="#">Rock</a></li> {/* */}
                            <li><a href="#">Bossa nova</a></li> {/* */}
                            <li><a href="#">Jazz e Blues</a></li> {/* */}
                        </ul>
                    </div>
                    <div className="footer-column"> {/* */}
                        <h3>Contato</h3> {/* */}
                        <p>(19) 3590-000</p> {/* */}
                        <p>E-mail: faleconosco@listen.com.br</p> {/* */}
                    </div>
                </div>
            </footer>
        </>
    );
}

export default HomePage;