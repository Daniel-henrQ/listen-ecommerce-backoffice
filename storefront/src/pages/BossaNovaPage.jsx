import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
// IMPORTANDO O NOVO ARQUIVO DE ESTILO
import styles from '../assets/css/BossaNovaPage.module.css'; 
import { useAuth } from '../context/AuthContext.jsx';
import LiquidGlassSidebar from '../components/LiquidGlassSidebar';
import AuthModal from '../components/AuthModal';
import { Link } from 'react-router-dom';
import FavoritesPopup from '../components/FavoritesPopup';

// --- Caminhos para os logos ---
const logoWhitePath = '/listen-white.svg';

// --- MUDANÇA: 'RockPage' para 'BossaNovaPage' ---
function BossaNovaPage() {
    // --- State for Page Content ---
    const [productsRow1, setProductsRow1] = useState([]);
    const [productsRow2, setProductsRow2] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Refs e State para Loop Infinito ---
    const trackRef1 = useRef(null);
    const trackRef2 = useRef(null);
    const [isRow1Transitioning, setIsRow1Transitioning] = useState(true);
    const [isRow2Transitioning, setIsRow2Transitioning] = useState(true);
    const [currentSlideRow1, setCurrentSlideRow1] = useState(1);
    const [currentSlideRow2, setCurrentSlideRow2] = useState(1);

    // --- State and Logic for Layout ---
    const { 
        user, 
        logout, 
        favorites,
        addFavorite,
        removeFavorite,
        isAuthenticated,
        showAuthModal,
        setShowAuthModal
    } = useAuth();
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showFavorites, setShowFavorites] = useState(false);
    const [isNavSticky, setIsNavSticky] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const mainNavRef = useRef(null);
    const userMenuRef = useRef(null);

    // --- MUDANÇA: Fetch Bossa Nova Products ---
    useEffect(() => {
        const fetchBossaNovaProducts = async () => {
            setLoading(true);
            setError(null);
            try {
                // --- MUDANÇA: Categoria 'Rock' para 'Bossa Nova' ---
               const response = await api.get('/produtos?categoria=Bossa Nova'); 
                
                const allProducts = response.data;

                const midpoint = Math.ceil(allProducts.length / 2);
                setProductsRow1(allProducts.slice(0, midpoint));
                setProductsRow2(allProducts.slice(midpoint));

            } catch (err) {
                console.error("Error fetching Bossa Nova products:", err);
                // --- MUDANÇA: Mensagem de erro ---
                setError("Não foi possível carregar os produtos de Bossa Nova.");
            } finally {
                setLoading(false);
            }
        };
        fetchBossaNovaProducts();
    }, []);
    // --- FIM DA MUDANÇA ---

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
    const handleLogout = () => {
        logout();
        setIsUserMenuOpen(false);
    };

    // --- Render Auth Section (ATUALIZADO) ---
    const renderUserSection = () => {
        const handleIconClick = (event) => {
            event.stopPropagation();
            if (isAuthenticated) { setIsUserMenuOpen(prev => !prev); } 
            else { setShowAuthModal(true); } 
        };
        return (
            <div className="user-account-container" ref={userMenuRef}>
                <button
                    className="menu-btn icon-only-btn"
                    onClick={handleIconClick}
                    title={isAuthenticated ? `Conta de ${user?.nome}` : "Entrar ou Criar Conta"}
                    aria-haspopup={isAuthenticated ? "true" : "dialog"}
                    aria-expanded={isUserMenuOpen}
                    aria-label={isAuthenticated ? "Abrir menu do usuário" : "Entrar ou Criar Conta"}
                >
                    <span className="material-symbols-outlined">account_circle</span>
                </button>
                {isAuthenticated && isUserMenuOpen && (
                    <div className="user-dropdown-menu">
                        <ul>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); alert('Meus pedidos'); setIsUserMenuOpen(false); }}>Meus pedidos</a></li>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); alert('Meus dados'); setIsUserMenuOpen(false); }}>Meus dados</a></li>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); alert('Fale conosco'); setIsUserMenuOpen(false); }}>Fale conosco</a></li>
                            <li><a href="/politica" target="_blank" onClick={() => setIsUserMenuOpen(false)}>Política de dados</a></li>

                            {(user?.role === 'adm' || user?.role === 'vendas') && (
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

    // === INÍCIO DA CORREÇÃO ===
    // --- Lógica de Carrossel DINÂMICA (Corrigida) ---
    // A lógica anterior estava (<= 1024) => 1, o que conflitava com o CSS.
    // Esta lógica agora bate com as regras do CSS (mobile=1, tablet=2, desktop=3)
    const getProductsPerSlide = () => {
        if (window.innerWidth <= 768) { // Mobile (bate com flex-basis: 100%)
            return 1;
        }
        if (window.innerWidth <= 1024) { // Tablet (bate com flex-basis: 48%)
            return 2;
        }
        return 3; // Desktop (bate com flex-basis: 32%)
    };
    // === FIM DA CORREÇÃO ===

    const [productsPerSlide, setProductsPerSlide] = useState(getProductsPerSlide());
    const realTotalSlidesRow1 = Math.ceil(productsRow1.length / productsPerSlide);
    const realTotalSlidesRow2 = Math.ceil(productsRow2.length / productsPerSlide);

    // --- Atualiza ao Redimensionar (sem alterações) ---
    useEffect(() => {
        const handleResize = () => {
            setProductsPerSlide(getProductsPerSlide());
        };
        handleResize();
        setIsRow1Transitioning(false);
        setIsRow2Transitioning(false);
        setCurrentSlideRow1(1);
        setCurrentSlideRow2(1);
        requestAnimationFrame(() => {
            setIsRow1Transitioning(true);
            setIsRow2Transitioning(true);
        });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []); // Array vazio para rodar apenas no mount e unmount


    // --- Lógica de Navegação (Loop Infinito) (sem alterações) ---
    // Linha 1
    const nextSlideRow1 = () => {
        if (realTotalSlidesRow1 <= 1) return;
        setIsRow1Transitioning(true);
        setCurrentSlideRow1((prev) => prev + 1);
    };
    const prevSlideRow1 = () => {
        if (realTotalSlidesRow1 <= 1) return;
        setIsRow1Transitioning(true);
        setCurrentSlideRow1((prev) => prev - 1);
    };
    const handleTransitionEndRow1 = () => {
        if (currentSlideRow1 === realTotalSlidesRow1 + 1) {
            setIsRow1Transitioning(false);
            setCurrentSlideRow1(1);
        }
        if (currentSlideRow1 === 0) {
            setIsRow1Transitioning(false);
            setCurrentSlideRow1(realTotalSlidesRow1);
        }
    };
    // Linha 2
    const nextSlideRow2 = () => {
        if (realTotalSlidesRow2 <= 1) return;
        setIsRow2Transitioning(true);
        setCurrentSlideRow2((prev) => prev + 1);
    };
    const prevSlideRow2 = () => {
        if (realTotalSlidesRow2 <= 1) return;
        setIsRow2Transitioning(true);
        setCurrentSlideRow2((prev) => prev - 1);
    };
    const handleTransitionEndRow2 = () => {
        if (currentSlideRow2 === realTotalSlidesRow2 + 1) {
            setIsRow2Transitioning(false);
            setCurrentSlideRow2(1);
        }
        if (currentSlideRow2 === 0) {
            setIsRow2Transitioning(false);
            setCurrentSlideRow2(realTotalSlidesRow2);
        }
    };

    // --- Render Product Card (Atualizado com Lógica de Favoritos) ---
    const renderProductCard = (product) => {
        const isFavorito = isAuthenticated && favorites?.some(fav => fav._id === product._id);

        const handleToggleFavorite = (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (!isAuthenticated) {
                setShowAuthModal(true);
                return;
            }

            if (isFavorito) {
                removeFavorite(product._id);
            } else {
                addFavorite(product._id);
            }
        };

        return (
            <Link
                to={`/produto/${product._id}`}
                key={product._id}
                className={styles.productCardLink}
            >
                <div className={styles.productCard}>
                    <img
                        // --- CORREÇÃO: URL do backend (porta 3000) ---
                        src={`http://localhost:3000/uploads/${product.imagem}`}
                        alt={`${product.nome} - ${product.artista}`}
                        className={styles.productImage}
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className={styles.productInfo}>
                        <h3 className={styles.productTitle}>{product.nome}</h3>
                        <p className={styles.productArtist}>{product.artista}</p>
                        <p className={styles.productDescription}>{product.descricao}</p>

                        <div className={styles.productPriceContainer}>
                            <p className={styles.productPrice}>
                                R$ {product.preco?.toFixed(2).replace('.', ',') ?? '0,00'}
                            </p>
                            <button
                                className={`${styles.favoriteButton} ${isFavorito ? styles.isFavorite : ''}`}
                                aria-label={isFavorito ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
                                onClick={handleToggleFavorite}
                            >
                                <span className={`${styles.iconOutline} material-symbols-outlined`}>favorite_border</span>
                                <span className={`${styles.iconFilled} material-symbols-outlined`}>favorite</span>
                            </button>
                        </div>
                    </div>
                </div>
            </Link>
        );
    };

    // --- Função Helper de Placeholders (sem alterações) ---
    const renderPlaceholders = (slideIndex, products, rowNum) => {
        if (productsPerSlide === 1) return null;
        const productsInSlide = products.slice(slideIndex * productsPerSlide, (slideIndex + 1) * productsPerSlide).length;
        const placeholdersNeeded = productsPerSlide - productsInSlide;

        if (slideIndex === Math.ceil(products.length / productsPerSlide) - 1 && placeholdersNeeded > 0) {
            return Array.from({ length: placeholdersNeeded }).map((_, placeholderIndex) => (
                <div key={`placeholder-${rowNum}-${placeholderIndex}`} className={styles.productCardPlaceholder}></div>
            ));
        }
        return null;
    };

    // --- Função Helper para renderizar um slide (sem alterações) ---
    const renderSlide = (products, slideIndex, keyPrefix, rowNum) => {
        const slideProducts = products.slice(slideIndex * productsPerSlide, (slideIndex + 1) * productsPerSlide);
        if (slideProducts.length === 0) return null;

        return (
            <div key={`${keyPrefix}-${slideIndex}`} className={styles.carouselSlide}>
                {slideProducts.map(renderProductCard)}
                {slideIndex === Math.ceil(products.length / productsPerSlide) - 1 &&
                    keyPrefix.includes('orig') &&
                    renderPlaceholders(slideIndex, products, rowNum)}
            </div>
        );
    };
    
    // --- MUDANÇA: Função para renderizar o título colorido ---
    const renderBossaNovaTitle = () => {
        const title = "BOSSA NOVA";
        return (
            // Usando a nova classe de estilo
            <h1 className={styles.navBossaNovaTitle}>
                {title.split('').map((char, index) => (
                    // O CSS vai cuidar das cores alternadas
                    <span key={index}>{char}</span> 
                ))}
            </h1>
        );
    };

    return (
        <>
            <LiquidGlassSidebar
                isOpen={isSidebarOpen}
                onClose={handleCloseSidebar}
                userName={user?.name || 'Visitante'}
            />
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />
            {showFavorites && <FavoritesPopup onClose={() => setShowFavorites(false)} />}


            {/* --- Navigation Bar --- */}
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
                    {/* --- MUDANÇA: Renderiza o título customizado --- */}
                    {renderBossaNovaTitle()}
                </div>
                <div className={styles.navRight}>
                    <a href="#" title="Localização"><span className="material-symbols-outlined">location_on</span></a>
                    {isAuthenticated && (
                         <button 
                            className="menu-btn icon-only-btn"
                            title="Favoritos" 
                            onClick={() => setShowFavorites(true)}
                            style={{ color: 'white' }} 
                        >
                            <span className="material-symbols-outlined">favorite</span>
                        </button>
                    )}
                    <a href="#" title="Carrinho"><span className="material-symbols-outlined">shopping_cart</span></a>
                    {renderUserSection()}
                </div>
            </nav>

            {/* --- Header Section (Breadcrumbs) --- */}
            {/* --- MUDANÇA: Classe de estilo do Hero --- */}
            <header className={styles.bossaNovaHeroSection}>
                <div className={styles.heroContent}>
                    <p className={styles.breadcrumbs}>
                        {/* --- MUDANÇA: Breadcrumb --- */}
                        <Link to="/">Home</Link> / Bossa Nova
                    </p>
                </div>
            </header>

            {/* --- Main Content Area --- */}
            <main className={styles.pageContent}>
                {loading && <p className={styles.loadingMessage}>Carregando produtos...</p>}
                {error && <p className={styles.errorMessage}>{error}</p>}
                {/* --- MUDANÇA: Mensagem de "sem produtos" --- */}
                {!loading && !error && productsRow1.length === 0 && (
                    <p className={styles.noProductsMessage}>Nenhum produto de Bossa Nova encontrado.</p>
                )}

                {/* --- CARROSSEL LINHA 1 (Sem alterações de lógica) --- */}
                {!loading && !error && productsRow1.length > 0 && (
                    <div className={styles.carouselContainer}>
                        <div
                            ref={trackRef1}
                            className={styles.carouselTrack}
                            style={{
                                transform: `translateX(-${currentSlideRow1 * 100}%)`,
                                transition: isRow1Transitioning ? 'transform 0.5s ease-in-out' : 'none'
                            }}
                            onTransitionEnd={handleTransitionEndRow1}
                        >
                            {realTotalSlidesRow1 > 1 && renderSlide(productsRow1, realTotalSlidesRow1 - 1, 'r1-clone-last', 1)}
                            {Array.from({ length: realTotalSlidesRow1 }).map((_, slideIndex) =>
                                renderSlide(productsRow1, slideIndex, `r1-orig`, 1)
                            )}
                            {realTotalSlidesRow1 > 1 && renderSlide(productsRow1, 0, 'r1-clone-first', 1)}
                        </div>

                        {realTotalSlidesRow1 > 1 && (
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

                {/* --- CARROSSEL LINHA 2 (Sem alterações de lógica) --- */}
                {!loading && !error && productsRow2.length > 0 && (
                    <div className={styles.carouselContainer}>
                        <div
                            ref={trackRef2}
                            className={styles.carouselTrack}
                            style={{
                                transform: `translateX(-${currentSlideRow2 * 100}%)`,
                                transition: isRow2Transitioning ? 'transform 0.5s ease-in-out' : 'none'
                            }}
                            onTransitionEnd={handleTransitionEndRow2}
                        >
                            {realTotalSlidesRow2 > 1 && renderSlide(productsRow2, realTotalSlidesRow2 - 1, 'r2-clone-last', 2)}
                            {Array.from({ length: realTotalSlidesRow2 }).map((_, slideIndex) =>
                                renderSlide(productsRow2, slideIndex, `r2-orig`, 2)
                            )}
                            {realTotalSlidesRow2 > 1 && renderSlide(productsRow2, 0, 'r2-clone-first', 2)}
                        </div>

                        {realTotalSlidesRow2 > 1 && (
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

            {/* --- MUDANÇA: Classe do Footer --- */}
            <footer className={styles.bossaNovaFooter}>
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

// --- MUDANÇA: Export 'BossaNovaPage' ---
export default BossaNovaPage;