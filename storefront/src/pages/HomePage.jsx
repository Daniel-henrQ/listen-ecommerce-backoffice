import React, { useState, useEffect, useRef, useContext } from 'react';
import '../assets/css/HomePage.css'; //
import { AuthContext } from '../context/AuthContext.jsx'; //
import { Link } from 'react-router-dom'; // <<< CORREÇÃO: Importa o Link

// Caminhos para os logos
const logoWhitePath = '/listen-white.svg'; //
const logoDarkPath = '/listen.svg'; //

// A prop onOpenAuthModal é necessária para abrir o modal no clique do ícone
function HomePage({ onOpenSidebar, onOpenAuthModal }) {
    const { user, logout } = useContext(AuthContext); //
    const [isNavSticky, setIsNavSticky] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const mainNavRef = useRef(null);
    const userMenuRef = useRef(null); // Ref para o menu dropdown

    // <<< CÓDIGO INCORPORADO >>>
    // Este hook gerencia a cor de fundo global
    useEffect(() => {
        // Adiciona a classe 'bg-light' ao body quando a HomePage carregar
        document.body.classList.add('bg-light');

        // Função de "limpeza": remove a classe quando a HomePage for "desmontada"
        return () => {
            document.body.classList.remove('bg-light');
        };
    }, []); // O array vazio [] garante que isso rode apenas na montagem e desmontagem
    // <<< FIM DO CÓDIGO INCORPORADO >>>

    // Efeito para o scroll da nav
    useEffect(() => {
        const handleScroll = () => setIsNavSticky(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Efeito para fechar o dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Fecha o menu se clicar fora do userMenuRef
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };
        // Adiciona o listener apenas se o menu estiver aberto
        if (isUserMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        // Limpeza: remove o listener quando o componente desmonta ou o menu fecha
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isUserMenuOpen]); // Re-executa quando isUserMenuOpen muda


    // Função de Logout
    const handleLogout = () => {
        logout(); // Chama a função do contexto
        setIsUserMenuOpen(false); // Fecha o menu dropdown
    };

    // Função para renderizar o ícone de usuário e o dropdown/modal trigger
    const renderUserSection = () => {
        // Lógica do clique no ícone
        const handleIconClick = (event) => {
             event.stopPropagation(); // Impede que o clique feche o menu imediatamente
            if (user.isAuthenticated) {
                // Se autenticado, abre/fecha o dropdown
                setIsUserMenuOpen(prev => !prev);
            } else {
                // Se NÃO autenticado, abre o modal de login
                onOpenAuthModal('login');
            }
        };

        return (
            // Adiciona a ref ao container
            <div className="user-account-container" ref={userMenuRef}> {/* */}
                <button
                    className="menu-btn icon-only-btn" //
                    onClick={handleIconClick} // Chama a lógica correta
                    title={user.isAuthenticated ? `Conta de ${user.name}` : "Entrar ou Criar Conta"}
                    aria-haspopup={user.isAuthenticated ? "true" : "dialog"} // dialog se abre modal
                    aria-expanded={isUserMenuOpen}
                    aria-label={user.isAuthenticated ? "Abrir menu do usuário" : "Entrar ou Criar Conta"}
                >
                    {/* Ícone de Usuário */}
                    <span className="material-symbols-outlined">account_circle</span>
                </button>

                {/* Dropdown do Usuário (Renderiza apenas se logado e o menu estiver aberto) */}
                {user.isAuthenticated && isUserMenuOpen && (
                    // Não precisa de stopPropagation aqui, pois está dentro do userMenuRef
                    <div className="user-dropdown-menu"> {/* */}
                        <ul>
                            {/* Opções baseadas na imagem */}
                            <li><a href="#" onClick={(e) => { e.preventDefault(); alert('Meus pedidos'); setIsUserMenuOpen(false); }}>Meus pedidos</a></li>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); alert('Meus dados'); setIsUserMenuOpen(false); }}>Meus dados</a></li>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); alert('Fale conosco'); setIsUserMenuOpen(false); }}>Fale conosco</a></li>
                            <li><a href="/politica" target="_blank" onClick={() => setIsUserMenuOpen(false)}>Política de dados</a></li>


                            {/* Link condicional para Backoffice (apenas para adm/vendas) */}
                            {(user.role === 'adm' || user.role === 'vendas') && (
                                <li className="user-dropdown-separator"><a href="/app" onClick={() => setIsUserMenuOpen(false)}>Backoffice</a></li> //
                            )}

                            {/* Botão Sair com separador */}
                            <li className="user-dropdown-separator"> {/* */}
                                <button onClick={handleLogout} className="user-dropdown-logout-btn"> {/* */}
                                    Sair
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    // Estrutura JSX da página (header, nav, main, footer)
    return (
        <>
            <header className="hero-section"> {/* */}
                 <div className="video-background"> {/* */}
                    <video src="/Minimalist_Vinyl_Record_Video_Generation.mp4" autoPlay muted loop playsInline></video>
                    <div className="video-overlay"></div> {/* */}
                 </div>

                <nav ref={mainNavRef} className={`main-nav ${isNavSticky ? 'nav-is-sticky' : ''}`}> {/* */}
                    <div className="nav-left"> {/* */}
                        <button className="menu-btn" onClick={onOpenSidebar}> {/* */}
                            <span className="material-symbols-outlined">menu</span>
                            MENU
                        </button>
                        <div className="search-bar"> {/* */}
                             <span className="material-symbols-outlined">search</span>
                             <input type="search" placeholder="Search" />
                        </div>
                    </div>

                    <div className="nav-center"> {/* */}
                         <div className="logo-container"> {/* */}
                            <img src={isNavSticky ? logoDarkPath : logoWhitePath} alt="Listen." className="logo-svg" /> {/* */}
                         </div>
                    </div>

                    <div className="nav-right"> {/* */}
                        <a href="#" title="Localização"><span className="material-symbols-outlined">location_on</span></a>
                        <a href="#" title="Favoritos"><span className="material-symbols-outlined">favorite</span></a>
                        <a href="#" title="Carrinho"><span className="material-symbols-outlined">shopping_cart</span></a>
                        {/* Ícone de usuário (que abre dropdown ou modal) */}
                        {renderUserSection()}
                    </div>
                </nav>
            </header>

              <main>
                  <section className="about-us"> {/* */}
                      <h2>A listen.</h2>
                        <p>Ouvir um vinil é um ritual. É tirar o disco da capa com cuidado, colocar na vitrola, ouvir os estalos antes da primeira nota. É presença. É tempo. É arte que gira. A listen. nasceu desse sentimento.</p>
                        <p>Não somos apenas uma loja. Somos um lugar que entende que a música tem textura, tem cheiro, tem peso. Que o design pode mudar de forma conforme o som muda de tom. Que o rock pede contraste, o jazz pede elegância, e a bossa nova dança em sutileza. Aqui, cada gênero tem espaço para ser o que é, sem se encaixar em moldes. Do clean ao punk, sem esforço.</p>
                        <p>Criamos a listen. porque acreditamos que estética importa. Mas sentimento importa mais. Se você coleciona discos porque cada um carrega uma história, está no lugar certo. Se você enxerga beleza no que é imperfeito, analógico, real seja bem-vindo. A gente compartilha do mesmo som.</p>
                  </section>
              </main>
              <footer> {/* */}
                  <div className="footer-container"> {/* */}
                      <div className="footer-column"> {/* */}
                          <h3>Junte-se a nós</h3>
                          <p>Cadastre seu e-mail e receba 50% de desconto na primeira compra</p>
                          <form className="newsletter-form"> {/* */}
                              <input type="text" placeholder="Nome" required/>
                              <input type="email" placeholder="E-mail" required/>
                               
                          </form>
                      </div>
                      <div className="footer-column"> {/* */}
                          <h3>Categorias</h3>
                          <ul>
                            <li><Link to="/rock">Rock</Link></li>
                             <li><Link to="/bossa-nova">Bossa nova</Link></li> {/* Atualizar links depois */}
                             <li><Link to="/jazz-blues">Jazz e Blues</Link></li> {/* Atualizar links depois */}
                              <li><Link to="/pop">Pop</Link></li> {/* Atualizar links depois */}
                          </ul>
                      </div>
                      <div className="footer-column"> {/* */}
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