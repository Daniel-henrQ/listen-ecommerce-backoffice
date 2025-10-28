import React, { useState, useEffect, useRef, useContext } from 'react';
import api from '../services/api';
import styles from '../assets/css/RockPage.module.css';
import { AuthContext } from '../context/AuthContext.jsx';
import LiquidGlassSidebar from '../components/LiquidGlassSidebar';
import AuthModal from '../components/AuthModal';
import { Link } from 'react-router-dom';

// --- Caminhos para os logos ---
const logoWhitePath = '/listen-white.svg';

function RockPage() {
    // --- State for Page Content ---
    // AJUSTE: Dividido em duas linhas de produtos
    const [productsRow1, setProductsRow1] = useState([]);
    const [productsRow2, setProductsRow2] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // AJUSTE: Estado de slide individual para cada linha
    const [currentSlideRow1, setCurrentSlideRow1] = useState(0);
    const [currentSlideRow2, setCurrentSlideRow2] = useState(0);

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
                const response = await api.get('/produtos?categoria=Rock');
                const allProducts = response.data;

                // AJUSTE: Divide os produtos em duas linhas
                const midpoint = Math.ceil(allProducts.length / 2);
                setProductsRow1(allProducts.slice(0, midpoint));
                setProductsRow2(allProducts.slice(midpoint));

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
                     <div className="user-dropdown-menu"> 
                         <ul>
                             <li><a href="#" onClick={(e) => { e.preventDefault(); alert('Meus pedidos'); setIsUserMenuOpen(false); }}>Meus pedidos</a></li>
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

    // --- AJUSTE: Lógica de Carrossel para CADA LINHA ---
    const productsPerSlide = 3; // 3 produtos por slide (em cada linha)

    // Lógica para Linha 1
    const totalSlidesRow1 = Math.ceil(productsRow1.length / productsPerSlide);
    const nextSlideRow1 = () => setCurrentSlideRow1((prev) => (prev + 1) % totalSlidesRow1);
    const prevSlideRow1 = () => setCurrentSlideRow1((prev) => (prev - 1 + totalSlidesRow1) % totalSlidesRow1);

    // Lógica para Linha 2
    const totalSlidesRow2 = Math.ceil(productsRow2.length / productsPerSlide);
    const nextSlideRow2 = () => setCurrentSlideRow2((prev) => (prev + 1) % totalSlidesRow2);
    const prevSlideRow2 = () => setCurrentSlideRow2((prev) => (prev - 1 + totalSlidesRow2) % totalSlidesRow2);

    // --- MODIFICADO: Função Helper para renderizar card (COM coração) ---
    const renderProductCard = (product) => (
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
                <p className={styles.productDescription}>{product.descricao}</p>
                
                {/* --- CONTAINER DO PREÇO E CORAÇÃO (NOVO) --- */}
                <div className={styles.productPriceContainer}>
                    <p className={styles.productPrice}>
                        R$ {product.preco?.toFixed(2) ?? '0.00'}
                    </p>
                    {/* --- BOTÃO DE CORAÇÃO (NOVO) --- */}
                    <button className={styles.favoriteButton} aria-label="Adicionar aos Favoritos">
                        <span className={`${styles.iconOutline} material-symbols-outlined`}>favorite_border</span>
                        <span className={`${styles.iconFilled} material-symbols-outlined`}>favorite</span>
                    </button>
                </div>
            </div>
        </div>
    );

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
                     <p className={styles.breadcrumbs}>
                         <Link to="/">Home</Link> / Rock
                     </p>
                 </div>
            </header>

            {/* --- Main Content Area com fundo de couro --- */}
            <main className={styles.pageContent}>
                {loading && <p className={styles.loadingMessage}>Carregando produtos...</p>}
                {error && <p className={styles.errorMessage}>{error}</p>}
                {!loading && !error && productsRow1.length === 0 && (
                    <p className={styles.noProductsMessage}>Nenhum produto de Rock encontrado.</p>
                )}

                {/* --- CARROSSEL LINHA 1 --- */}
                {!loading && !error && productsRow1.length > 0 && (
                    <div className={styles.carouselContainer}>
                        <div className={styles.carouselTrack} style={{ transform: `translateX(-${currentSlideRow1 * 100}%)` }}> 
                            {Array.from({ length: totalSlidesRow1 }).map((_, slideIndex) => (
                                <div key={slideIndex} className={styles.carouselSlide}>
                                    {productsRow1.slice(slideIndex * productsPerSlide, (slideIndex + 1) * productsPerSlide).map(renderProductCard)}
                                    
                                    {/* Placeholders para Linha 1 */}
                                    {slideIndex === totalSlidesRow1 - 1 && productsRow1.slice(slideIndex * productsPerSlide, (slideIndex + 1) * productsPerSlide).length < productsPerSlide && (
                                        Array.from({ length: productsPerSlide - productsRow1.slice(slideIndex * productsPerSlide, (slideIndex + 1) * productsPerSlide).length }).map((_, placeholderIndex) => (
                                            <div key={`placeholder-1-${placeholderIndex}`} className={styles.productCardPlaceholder}></div>
                                        ))
                                    )}
                                </div>
                             ))}
                        </div>

                         {/* Botões Linha 1 */}
                         {totalSlidesRow1 > 1 && (
                            <>
                                <button onClick={prevSlideRow1} className={`${styles.carouselButton} ${styles.prev}`}>
                                    <span className="material-symbols-outlined">chevron_left</span>
                                </button>
                                <button onClick={nextSlideRow1} className={`${styles.carouselButton} ${styles.next}`}>
                                    <span className="material-symbols-outlined">chevron_right</span>
                                </button>
                            </>
                         )}
                    </div>
                )}

                {/* --- CARROSSEL LINHA 2 --- */}
                {!loading && !error && productsRow2.length > 0 && (
                    <div className={styles.carouselContainer}>
                        <div className={styles.carouselTrack} style={{ transform: `translateX(-${currentSlideRow2 * 100}%)` }}> 
                            {Array.from({ length: totalSlidesRow2 }).map((_, slideIndex) => (
                                <div key={slideIndex} className={styles.carouselSlide}>
                                    {productsRow2.slice(slideIndex * productsPerSlide, (slideIndex + 1) * productsPerSlide).map(renderProductCard)}
                                    
                                    {/* Placeholders para Linha 2 */}
                                    {slideIndex === totalSlidesRow2 - 1 && productsRow2.slice(slideIndex * productsPerSlide, (slideIndex + 1) * productsPerSlide).length < productsPerSlide && (
                                        Array.from({ length: productsPerSlide - productsRow2.slice(slideIndex * productsPerSlide, (slideIndex + 1) * productsPerSlide).length }).map((_, placeholderIndex) => (
                                            <div key={`placeholder-2-${placeholderIndex}`} className={styles.productCardPlaceholder}></div>
                                        ))
                                    )}
                                </div>
                             ))}
                        </div>

                         {/* Botões Linha 2 */}
                         {totalSlidesRow2 > 1 && (
                            <>
                                <button onClick={prevSlideRow2} className={`${styles.carouselButton} ${styles.prev}`}>
                                    <span className="material-symbols-outlined">chevron_left</span>
                                </button>
                                <button onClick={nextSlideRow2} className={`${styles.carouselButton} ${styles.next}`}>
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
                    {/* ... (colunas do footer) ... */}
                    <div className={styles.footerColumn}>
                        <h3>Junte-se a nós</h3>
                        <p>Cadastre seu e-mail e receba 10% de desconto na primeira compra</p>
                         <form className={styles.newsletterForm}>
                            <input type="text" placeholder="Nome" required />
                            <input type="email" placeholder="E-mail" required />
                         </form>
                    </div>
                    <div className={styles.footerColumn}>
                        <h3>Categorias</h3>
                        <ul>
                            <li><Link to="/rock">Rock</Link></li>
                            <li><Link to="/bossa-nova">Bossa nova</Link></li>
                            <li><Link to="/jazz-blues">Jazz e Blues</Link></li>
                        </ul>
                    </div>
                    <div className={styles.footerColumn}>
                        <h3>Contato</h3>
                        <p>(19) 3590-000</p>
                        <p>E-mail: faleconosco@listen.com.br</p>
                    </div>
                     <div className={`${styles.footerColumn} ${styles.footerLogoColumn}`}>
                         <Link to="/"> 
                             <img src={logoWhitePath} alt="Listen." className={styles.footerLogo} />
                          </Link> 
                     </div>
                </div>
            </footer>
        </>
    );
}

export default RockPage;