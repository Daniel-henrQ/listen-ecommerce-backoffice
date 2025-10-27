import React, { useState, useEffect, useRef, useContext } from 'react';
import api from '../services/api';
import styles from '../assets/css/RockPage.module.css';
import { AuthContext } from '../context/AuthContext.jsx';
import LiquidGlassSidebar from '../components/LiquidGlassSidebar';
import AuthModal from '../components/AuthModal';
import { Link } from 'react-router-dom'; // <<< IMPORTADO CORRETAMENTE

// --- Caminhos para os logos ---
const logoWhitePath = '/listen-white.svg'; // Assuming in public folder

function RockPage() {
    // --- State for Page Content ---
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentSlide, setCurrentSlide] = useState(0);

    // --- State and Logic for Layout ---
    const { user, logout } = useContext(AuthContext);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isNavSticky, setIsNavSticky] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const mainNavRef = useRef(null);
    const userMenuRef = useRef(null);

    // --- Fetch Rock Products ---
    useEffect(() => {
        const fetchRockProducts = async () => {
            setLoading(true);
            setError(null);
            try {
                // Simulação de API
                // const response = await api.get('/produtos?categoria=Rock');
                // setProducts(response.data);
                console.log("Buscando produtos de Rock...");
            } catch (err) {
                console.error("Error fetching rock products:", err);
                setError("Não foi possível carregar os produtos de Rock.");
            } finally {
                setLoading(false);
            }
        };
        fetchRockProducts();
    }, []);

    // --- Sticky Nav Logic ---
    useEffect(() => {
        const handleScroll = () => {
             // Ajuste o valor (ex: 10) se a nav for maior
            setIsNavSticky(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // --- User Dropdown Logic ---
     useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };
        if (isUserMenuOpen) { document.addEventListener("mousedown", handleClickOutside); }
        else { document.removeEventListener("mousedown", handleClickOutside); }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isUserMenuOpen]);


    // --- Handlers ---
    const handleCloseSidebar = () => setIsSidebarOpen(false);
    const openAuthModal = (view = 'login') => {
        setIsAuthModalOpen(true);
        document.body.classList.add('modal-open');
    };
    const closeAuthModal = () => {
        setIsAuthModalOpen(false);
        document.body.classList.remove('modal-open');
    };
     const handleLogout = () => {
        logout();
        setIsUserMenuOpen(false);
    };

    // --- Render Auth Section ---
     const renderUserSection = () => {
        const handleIconClick = (event) => {
             event.stopPropagation();
            if (user.isAuthenticated) { setIsUserMenuOpen(prev => !prev); }
            else { openAuthModal('login'); }
        };
        return (
            <div className="user-account-container" ref={userMenuRef}>
                <button
                    className="menu-btn icon-only-btn"
                    onClick={handleIconClick}
                    title={user.isAuthenticated ? `Conta de ${user.name}` : "Entrar ou Criar Conta"}
                    aria-haspopup={user.isAuthenticated ? "true" : "dialog"}
                    aria-expanded={isUserMenuOpen}
                    aria-label={user.isAuthenticated ? "Abrir menu do usuário" : "Entrar ou Criar Conta"}
                >
                    <span className="material-symbols-outlined">account_circle</span>
                </button>
                {user.isAuthenticated && isUserMenuOpen && (
                     <div className="user-dropdown-menu"> {/* Use global style from HomePage.css */}
                        <ul>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); alert('Meus pedidos'); setIsUserMenuOpen(false); }}>Meus pedidos</a></li>
                            {/* ... other items ... */}
                            <li><a href="/politica" target="_blank" onClick={() => setIsUserMenuOpen(false)}>Política de dados</a></li>
                            {(user.role === 'adm' || user.role === 'vendas') && (
                                <li className="user-dropdown-separator"><a href="/app" onClick={() => setIsUserMenuOpen(false)}>Backoffice</a></li>
                            )}
                            <li className="user-dropdown-separator">
                                <button onClick={handleLogout} className="user-dropdown-logout-btn">Sair</button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    // --- Basic Carousel Logic ---
    const productsPerSlide = 3;
    const totalSlides = Math.ceil(products.length / productsPerSlide);
    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    const getPaginatedProducts = () => {
        const startIndex = currentSlide * productsPerSlide;
        const endIndex = startIndex + productsPerSlide;
        return products.slice(startIndex, endIndex);
    };
    const displayedProducts = getPaginatedProducts();

    return (
        <>
            <LiquidGlassSidebar
              isOpen={isSidebarOpen}
              onClose={handleCloseSidebar}
              userName={user.name || 'Visitante'}
            />
            <AuthModal
              isOpen={isAuthModalOpen}
              onClose={closeAuthModal}
            />

            {/* --- Navigation Bar (Fora do Header) --- */}
             <nav ref={mainNavRef} className={`${styles.mainNav} ${isNavSticky ? styles.navIsSticky : ''}`}>
                 <div className={styles.navLeft}>
                     <button className={styles.menuBtn} onClick={() => setIsSidebarOpen(true)}>
                         <span className="material-symbols-outlined">menu</span>
                         MENU
                     </button>
                     <div className={styles.searchBar}>
                          <span className="material-symbols-outlined">search</span>
                          <input type="search" placeholder="Search" />
                     </div>
                 </div>
                 <div className={styles.navCenter}>
                      <h1 className={styles.navRockTitle}>ROCK</h1>
                 </div>
                 <div className={styles.navRight}>
                    <a href="#" title="Localização"><span className="material-symbols-outlined">location_on</span></a>
                    <a href="#" title="Favoritos"><span className="material-symbols-outlined">favorite</span></a>
                    <a href="#" title="Carrinho"><span className="material-symbols-outlined">shopping_cart</span></a>
                    {renderUserSection()}
                 </div>
             </nav>

            {/* --- Header Section (Apenas Breadcrumbs) --- */}
            <header className={styles.rockHeroSection}>
                 <div className={styles.heroContent}>
                     {/* Breadcrumbs com Link funcional */}
                     <p className={styles.breadcrumbs}>
                         <Link to="/">Home</Link> / Rock
                     </p>
                 </div>
            </header>

            {/* --- Main Content Area com fundo de couro --- */}
            <main className={styles.pageContent}>
                {loading && <p className={styles.loadingMessage}>Carregando produtos...</p>}
                {error && <p className={styles.errorMessage}>{error}</p>}
                {!loading && !error && products.length === 0 && (
                    <p className={styles.noProductsMessage}>Nenhum produto de Rock encontrado.</p>
                )}
                {!loading && !error && products.length > 0 && (
                    <div className={styles.carouselContainer}>
                        <div className={styles.carouselTrack} style={{ transform: `translateX(-${currentSlide * 100}%)` }}> {/* Add basic slide transition */}
                            {/* Renderizar todos os slides, CSS cuidará da exibição */}
                            {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                                <div key={slideIndex} className={styles.carouselSlide}>
                                    {products.slice(slideIndex * productsPerSlide, (slideIndex + 1) * productsPerSlide).map(product => (
                                        <div key={product._id} className={styles.productCard}>
                                            <img
                                                src={`/uploads/${product.imagem}`}
                                                alt={`${product.nome} - ${product.artista}`}
                                                className={styles.productImage}
                                                onError={(e) => { e.target.style.display='none'; }}
                                            />
                                            <div className={styles.productInfo}>
                                                <h3 className={styles.productTitle}>{product.nome}</h3>
                                                <p className={styles.productArtist}>{product.artista}</p>
                                                <p className={styles.productDescription}>
                                                    {product.descricao ? `${product.descricao.substring(0, 100)}...` : 'Um disco essencial para sua coleção.'}
                                                </p>
                                                <p className={styles.productPrice}>
                                                    R$ {product.preco?.toFixed(2) ?? '0.00'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {/* Adicionar placeholders se o último slide não estiver completo */}
                                    {slideIndex === totalSlides - 1 && products.slice(slideIndex * productsPerSlide, (slideIndex + 1) * productsPerSlide).length < productsPerSlide && (
                                        Array.from({ length: productsPerSlide - products.slice(slideIndex * productsPerSlide, (slideIndex + 1) * productsPerSlide).length }).map((_, placeholderIndex) => (
                                            <div key={`placeholder-${placeholderIndex}`} className={styles.productCardPlaceholder}></div> // Placeholder para manter o layout
                                        ))
                                    )}
                                </div>
                             ))}
                        </div>

                         {/* Navigation Buttons */}
                         {totalSlides > 1 && (
                            <>
                                <button onClick={prevSlide} className={`${styles.carouselButton} ${styles.prev}`}>
                                    <span className="material-symbols-outlined">chevron_left</span>
                                </button>
                                <button onClick={nextSlide} className={`${styles.carouselButton} ${styles.next}`}>
                                    <span className="material-symbols-outlined">chevron_right</span>
                                </button>
                            </>
                         )}
                    </div>
                )}
            </main>

            {/* --- Footer (Menor e com fundo) --- */}
            <footer className={styles.rockFooter}>
                <div className={styles.footerContainer}>
                    {/* Column 1: Newsletter */}
                    <div className={styles.footerColumn}>
                        <h3>Junte-se a nós</h3>
                        <p>Cadastre seu e-mail e receba 10% de desconto na primeira compra</p>
                         <form className={styles.newsletterForm}>
                            <input type="text" placeholder="Nome" required />
                            <input type="email" placeholder="E-mail" required />
                        
                        </form>
                    </div>
                    {/* Column 2: Categories */}
                    <div className={styles.footerColumn}>
                        <h3>Categorias</h3>
                        <ul>
                            <li><Link to="/rock">Rock</Link></li>
                            <li><Link to="/bossa-nova">Bossa nova</Link></li>
                            <li><Link to="/jazz-blues">Jazz e Blues</Link></li>
                        </ul>
                    </div>
                    {/* Column 3: Contact */}
                    <div className={styles.footerColumn}>
                        <h3>Contato</h3>
                        <p>(19) 3590-000</p>
                        <p>E-mail: faleconosco@listen.com.br</p>
                    </div>
                     {/* Column 4: Logo */}
                     <div className={`${styles.footerColumn} ${styles.footerLogoColumn}`}>
                        <Link to="/"> {/* <<< ADICIONE ESTA LINHA */}
                            <img src={logoWhitePath} alt="Listen." className={styles.footerLogo} />
                         </Link> {/* <<< ADICIONE ESTA LINHA */}
                     </div>
                </div>
            </footer>
        </>
    );
}

export default RockPage;