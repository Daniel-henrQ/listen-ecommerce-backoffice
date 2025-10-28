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
    const [productsRow1, setProductsRow1] = useState([]);
    const [productsRow2, setProductsRow2] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- AJUSTE: Refs e State para Loop Infinito ---
    const trackRef1 = useRef(null);
    const trackRef2 = useRef(null);
    const [isRow1Transitioning, setIsRow1Transitioning] = useState(true);
    const [isRow2Transitioning, setIsRow2Transitioning] = useState(true);

    // O state inicial é 1 (o primeiro slide real, não o clone do último)
    const [currentSlideRow1, setCurrentSlideRow1] = useState(1);
    const [currentSlideRow2, setCurrentSlideRow2] = useState(1);


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

    // --- Render Auth Section (ATUALIZADO) ---
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
                {/* --- CONTEÚDO DO DROPDOWN ATUALIZADO --- */}
                {user.isAuthenticated && isUserMenuOpen && (
                    <div className="user-dropdown-menu">
                        <ul>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); alert('Meus pedidos'); setIsUserMenuOpen(false); }}>Meus pedidos</a></li>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); alert('Meus dados'); setIsUserMenuOpen(false); }}>Meus dados</a></li>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); alert('Fale conosco'); setIsUserMenuOpen(false); }}>Fale conosco</a></li>
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
                {/* --- FIM DA ATUALIZAÇÃO --- */}
            </div>
        );
    };

    // --- AJUSTE: Lógica de Carrossel DINÂMICA 
    const getProductsPerSlide = () => {
        if (window.innerWidth <= 1024) { // Telas menores (tablet e mobile)
            return 1;
        }
        return 3; // Telas maiores (desktop)
    };
    const [productsPerSlide, setProductsPerSlide] = useState(getProductsPerSlide());

    // --- Totais de Slides (Base) ---
    const realTotalSlidesRow1 = Math.ceil(productsRow1.length / productsPerSlide);
    const realTotalSlidesRow2 = Math.ceil(productsRow2.length / productsPerSlide);


    // --- Atualiza ao Redimensionar ---
    useEffect(() => {
        const handleResize = () => {
            setProductsPerSlide(getProductsPerSlide());
        };

        handleResize();

        // AJUSTE: Resetar para o slide 1 (o primeiro slide real)
        setIsRow1Transitioning(false);
        setIsRow2Transitioning(false);
        setCurrentSlideRow1(1);
        setCurrentSlideRow2(1);

        // Reativa transições após o salto (usando requestAnimationFrame para garantir)
        requestAnimationFrame(() => {
            setIsRow1Transitioning(true);
            setIsRow2Transitioning(true);
        });

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []); // Array vazio para rodar apenas no mount e unmount


    // --- AJUSTE: Lógica de Navegação (Loop Infinito) ---

    // Linha 1
    const nextSlideRow1 = () => {
        if (realTotalSlidesRow1 <= 1) return; // Não fazer nada se só houver 1 slide
        setIsRow1Transitioning(true);
        setCurrentSlideRow1((prev) => prev + 1);
    };
    const prevSlideRow1 = () => {
        if (realTotalSlidesRow1 <= 1) return;
        setIsRow1Transitioning(true);
        setCurrentSlideRow1((prev) => prev - 1);
    };
    const handleTransitionEndRow1 = () => {
        // Se foi para o clone do primeiro slide (index: realTotalSlides + 1)
        if (currentSlideRow1 === realTotalSlidesRow1 + 1) {
            setIsRow1Transitioning(false); // Desliga transição
            setCurrentSlideRow1(1); // Salta para o primeiro slide real (index 1)
        }
        // Se foi para o clone do último slide (index: 0)
        if (currentSlideRow1 === 0) {
            setIsRow1Transitioning(false);
            setCurrentSlideRow1(realTotalSlidesRow1); // Salta para o último slide real
        }
    };

    // Linha 2 (repetir lógica)
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


    // === INÍCIO DA MODIFICAÇÃO ===

    // --- Render Product Card (Atualizado com Link) ---
    const renderProductCard = (product) => (
        <Link
            to={`/produto/${product._id}`}
            key={product._id}
            className={styles.productCardLink} // Classe para estilizar o link
        >
            <div className={styles.productCard}>
                <img
                    // Caminho completo para a imagem (mais seguro)
                    src={`http://localhost:3000/uploads/${product.imagem}`}
                    alt={`${product.nome} - ${product.artista}`}
                    className={styles.productImage}
                    // Fallback visual caso a imagem não carregue
                    onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div className={styles.productInfo}>
                    <h3 className={styles.productTitle}>{product.nome}</h3>
                    <p className={styles.productArtist}>{product.artista}</p>
                    <p className={styles.productDescription}>{product.descricao}</p>

                    <div className={styles.productPriceContainer}>
                        <p className={styles.productPrice}>
                            {/* Preço formatado corretamente */}
                            R$ {product.preco?.toFixed(2).replace('.', ',') ?? '0,00'}
                        </p>
                        <button
                            className={styles.favoriteButton}
                            aria-label="Adicionar aos Favoritos"
                            // Previne que o clique no botão ative o Link do card
                            onClick={(e) => {
                                e.preventDefault();
                                alert('Adicionado aos favoritos!'); // Ação placeholder
                            }}
                        >
                            <span className={`${styles.iconOutline} material-symbols-outlined`}>favorite_border</span>
                            <span className={`${styles.iconFilled} material-symbols-outlined`}>favorite</span>
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );

    // === FIM DA MODIFICAÇÃO ===


    // --- Função Helper de Placeholders ---
    const renderPlaceholders = (slideIndex, products, rowNum) => {
        if (productsPerSlide === 1) return null; // Não renderiza placeholders se for 1 por slide

        const productsInSlide = products.slice(slideIndex * productsPerSlide, (slideIndex + 1) * productsPerSlide).length;
        const placeholdersNeeded = productsPerSlide - productsInSlide;

        if (slideIndex === Math.ceil(products.length / productsPerSlide) - 1 && placeholdersNeeded > 0) {
            return Array.from({ length: placeholdersNeeded }).map((_, placeholderIndex) => (
                <div key={`placeholder-${rowNum}-${placeholderIndex}`} className={styles.productCardPlaceholder}></div>
            ));
        }
        return null;
    };

    // --- AJUSTE: Função Helper para renderizar um slide (necessário para os clones) ---
    const renderSlide = (products, slideIndex, keyPrefix, rowNum) => {
        const slideProducts = products.slice(slideIndex * productsPerSlide, (slideIndex + 1) * productsPerSlide);

        // Evita renderizar slides "clone" vazios se não houver produtos (acontece no 1º load)
        if (slideProducts.length === 0) return null;

        return (
            <div key={`${keyPrefix}-${slideIndex}`} className={styles.carouselSlide}>
                {slideProducts.map(renderProductCard)}

                {/* Renderiza placeholders APENAS se for o ÚLTIMO slide REAL */}
                {slideIndex === Math.ceil(products.length / productsPerSlide) - 1 &&
                    keyPrefix.includes('orig') && // Só no slide original, não no clone
                    renderPlaceholders(slideIndex, products, rowNum)}
            </div>
        );
    };


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

            {/* --- Main Content Area --- */}
            <main className={styles.pageContent}>
                {loading && <p className={styles.loadingMessage}>Carregando produtos...</p>}
                {error && <p className={styles.errorMessage}>{error}</p>}
                {!loading && !error && productsRow1.length === 0 && (
                    <p className={styles.noProductsMessage}>Nenhum produto de Rock encontrado.</p>
                )}

                {/* --- CARROSSEL LINHA 1 (Atualizado para Loop) --- */}
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
                            {/* AJUSTE: Clone do ÚLTIMO slide (SÓ SE houver mais de 1 slide) */}
                            {realTotalSlidesRow1 > 1 && renderSlide(productsRow1, realTotalSlidesRow1 - 1, 'r1-clone-last', 1)}

                            {/* AJUSTE: Slides REAIS */}
                            {Array.from({ length: realTotalSlidesRow1 }).map((_, slideIndex) =>
                                renderSlide(productsRow1, slideIndex, `r1-orig`, 1)
                            )}

                            {/* AJUSTE: Clone do PRIMEIRO slide (SÓ SE houver mais de 1 slide) */}
                            {realTotalSlidesRow1 > 1 && renderSlide(productsRow1, 0, 'r1-clone-first', 1)}
                        </div>

                        {/* Botões Linha 1 */}
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

                {/* --- CARROSSEL LINHA 2 (Atualizado para Loop) --- */}
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
                            {/* Clone do ÚLTIMO (Linha 2) */}
                            {realTotalSlidesRow2 > 1 && renderSlide(productsRow2, realTotalSlidesRow2 - 1, 'r2-clone-last', 2)}

                            {/* Slides REAIS (Linha 2) */}
                            {Array.from({ length: realTotalSlidesRow2 }).map((_, slideIndex) =>
                                renderSlide(productsRow2, slideIndex, `r2-orig`, 2)
                            )}

                            {/* Clone do PRIMEIRO (Linha 2) */}
                            {realTotalSlidesRow2 > 1 && renderSlide(productsRow2, 0, 'r2-clone-first', 2)}
                        </div>

                        {/* Botões Linha 2 */}
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