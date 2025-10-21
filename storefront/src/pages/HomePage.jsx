import React, { useState, useEffect, useRef } from 'react';
import '../assets/css/HomePage.css'; // Importa o CSS adaptado

// Use /listen.png como fallback se os SVGs não funcionarem ou estiverem vazios
// const logoWhitePath = '/listen-white.svg'; // Caminho no public
// const logoDarkPath = '/listen.svg'; // Caminho no public
const logoWhitePath = '/listen.png'; // Usando PNG como fallback
const logoDarkPath = '/listen.png';  // Usando PNG como fallback


function HomePage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isNavSticky, setIsNavSticky] = useState(false);
    const mainNavRef = useRef(null);

    // Lógica para o menu lateral
    const toggleMenu = () => {
        // Usa o estado anterior para garantir a atualização correta
        setIsMenuOpen(prev => !prev);
    };

    // Lógica para a navegação sticky
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setIsNavSticky(true);
            } else {
                setIsNavSticky(false);
            }
        };

        window.addEventListener('scroll', handleScroll);

        // Limpa o event listener quando o componente desmonta
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []); // Array vazio significa que este efeito corre apenas uma vez (montagem/desmontagem)

    // Efeito para adicionar/remover a classe do body e estilo overflow (menu lateral)
    useEffect(() => {
        if (isMenuOpen) {
            document.body.classList.add('menu-is-open');
            document.body.style.overflow = 'hidden'; // Impede scroll do fundo
        } else {
            document.body.classList.remove('menu-is-open');
            document.body.style.overflow = '';
        }
        // Cleanup: remove a classe e o estilo se o componente for desmontado
        return () => {
            document.body.classList.remove('menu-is-open');
            document.body.style.overflow = '';
        };
    }, [isMenuOpen]); // Executa sempre que isMenuOpen mudar


    return (
        <>
            {/* Overlay e Menu Lateral */}
            {/* Renderização condicional da classe 'show' no overlay */}
            <div className={`menu-overlay ${isMenuOpen ? 'show' : ''}`} onClick={toggleMenu}></div>
            {/* Renderização condicional da classe 'open' no menu */}
            <aside className={`side-menu ${isMenuOpen ? 'open' : ''}`}>
                <div className="side-menu-header">
                    <h2>Menu</h2>
                    <button className="close-menu-btn" onClick={toggleMenu}>
                        {/* Ícone de fechar */}
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <nav className="side-menu-nav">
                    <ul>
                        {/* Links do menu lateral */}
                        <li><a href="#">Rock</a></li>
                        <li><a href="#">Bossa nova</a></li>
                        <li><a href="#">Jazz e Blues</a></li>
                        <li><a href="#">Soul</a></li>
                        <li><a href="#">Mpb</a></li>
                        <li><a href="#">Meus Pedidos</a></li>
                        <li><a href="#">Fale Conosco</a></li>
                    </ul>
                </nav>
            </aside>

            {/* Secção Hero */}
            <header className="hero-section">
                <div className="video-background">
                    {/* Referencia o vídeo na pasta public */}
                    <video src="/Minimalist_Vinyl_Record_Video_Generation.mp4" autoPlay muted loop playsInline></video>
                    <div className="video-overlay"></div>
                </div>

                {/* Navegação Principal */}
                {/* Adiciona ref e classe sticky condicional */}
                <nav ref={mainNavRef} className={`main-nav ${isNavSticky ? 'nav-is-sticky' : ''}`}>
                    <div className="nav-left">
                        {/* Botão de abrir menu */}
                        <button className="menu-btn" onClick={toggleMenu}>
                            <span className="material-symbols-outlined">menu</span>
                            MENU
                        </button>
                        {/* Barra de pesquisa */}
                        <div className="search-bar">
                            <span className="material-symbols-outlined">search</span>
                            <input type="search" placeholder="Search" />
                        </div>
                    </div>

                    <div className="nav-center">
                        <div className="logo-container">
                            {/* Logo que muda com o scroll */}
                            <img src={isNavSticky ? logoDarkPath : logoWhitePath} alt="Listen." className="logo-svg" />
                        </div>
                    </div>

                    <div className="nav-right">
                        {/* Ícones da direita */}
                        <a href="#" title="Localização">
                            <span className="material-symbols-outlined">location_on</span>
                        </a>
                        <div className="user-account">
                            <a href="#" title="Minha Conta">
                                <span className="material-symbols-outlined">person</span>
                            </a>
                            {/* Dropdown da conta */}
                            <ul className="dropdown-menu">
                                <li><a href="#">Meus pedidos</a></li>
                                <li><a href="#">Meus dados</a></li>
                                <li><a href="#">Fale Conosco</a></li>
                                <li><a href="#">Proteção de dados</a></li>
                                <li><a href="#">Cancelamento</a></li>
                            </ul>
                        </div>
                        <a href="#" title="Favoritos">
                            <span className="material-symbols-outlined">favorite</span>
                        </a>
                        <a href="#" title="Carrinho">
                            <span className="material-symbols-outlined">shopping_cart</span>
                        </a>
                    </div>
                </nav>
            </header>

            {/* Conteúdo Principal */}
            <main>
                <section className="about-us">
                    <h2>A listen.</h2>
                    <p>Ouvir um vinil é um ritual. É tirar o disco da capa com cuidado, colocar na vitrola, ouvir os estalos
                        antes da primeira nota. É presença. É tempo. É arte que gira.
                        A listen. nasceu desse sentimento.</p>
                    <p>Não somos apenas uma loja. Somos um lugar que entende que a música tem textura, tem cheiro, tem peso. Que
                        o design pode mudar de forma conforme o som muda de tom. Que o rock pede contraste, o jazz pede
                        elegância, e a bossa nova dança em sutileza. Aqui, cada gênero tem espaço para ser o que é, sem se
                        encaixar em moldes. Do clean ao punk, sem esforço.</p>
                    <p>Criamos a listen. porque acreditamos que estética importa. Mas sentimento importa mais.
                        Se você coleciona discos porque cada um carrega uma história, está no lugar certo. Se você enxerga
                        beleza no que é imperfeito, analógico, real seja bem-vindo.
                        A gente compartilha do mesmo som.</p>
                </section>
            </main>

            {/* Rodapé */}
            <footer>
                <div className="footer-container">
                    <div className="footer-column">
                        <h3>Junte-se a nós</h3>
                        <p>Cadastre seu e-mail e receba 50% de desconto na primeira compra</p>
                        <form className="newsletter-form">
                            <input type="text" placeholder="Nome" />
                            <input type="email" placeholder="E-mail" />
                            {/* Adicionar botão de submissão se necessário */}
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