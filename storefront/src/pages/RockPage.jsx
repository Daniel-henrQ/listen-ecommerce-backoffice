import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios'; // Or import your api service
import styles from '../assets/css/RockPage.module.css'; // We'll create this CSS module
import { AuthContext } from '../context/AuthContext.jsx';
import { jwtDecode } from "jwt-decode";
import LiquidGlassSidebar from '../components/LiquidGlassSidebar'; // Assuming reusable components
import AuthModal from '../components/AuthModal';

// --- Reusable Navigation/Header Logic (Adapted from HomePage) ---
const logoWhitePath = '/listen-white.svg';
const logoDarkPath = '/listen.svg';

function RockPage() {
    // --- State for Page Content ---
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- State and Logic copied/adapted from HomePage for Layout ---
    const { user } = useContext(AuthContext);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isNavSticky, setIsNavSticky] = useState(false);
    const mainNavRef = useRef(null);

    // --- Fetch Rock Products ---
    useEffect(() => {
        const fetchRockProducts = async () => {
            setLoading(true);
            setError(null);
            try {
                // Use your configured api instance if available
                const response = await axios.get('/api/produtos?categoria=Rock');
                setProducts(response.data);
            } catch (err) {
                console.error("Error fetching rock products:", err);
                setError("Não foi possível carregar os produtos de Rock.");
            } finally {
                setLoading(false);
            }
        };
        fetchRockProducts();
    }, []); // Empty dependency array means this runs once on mount

    // --- Sticky Nav Logic (from HomePage) ---
    useEffect(() => {
        const handleScroll = () => {
             setIsNavSticky(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

     // --- Sidebar/Modal Handlers (from App/HomePage) ---
     const handleCloseSidebar = () => setIsSidebarOpen(false);
     const openAuthModal = (view = 'login') => { // Accept view type
         console.log(`RockPage.jsx: Abrindo AuthModal (view: ${view})...`);
         setIsAuthModalOpen(true);
         // Optionally set initial view in modal if needed, depends on modal implementation
         document.body.classList.add('modal-open');
     };
     const closeAuthModal = () => {
         console.log("RockPage.jsx: Fechando AuthModal");
         setIsAuthModalOpen(false);
         document.body.classList.remove('modal-open');
     };

     // --- Auth Section Renderer (from HomePage) ---
     const renderAuthSection = () => {
        if (user.isAuthenticated) { // Check context directly
            let userRole = user.role;
            let userName = user.name;

            const handleLogout = () => {
                localStorage.removeItem('authToken'); // Assuming logout clears token
                window.location.reload();
            };

            if (userRole === 'adm' || userRole === 'vendas') {
                const backofficeUrlBase = import.meta.env.DEV ? 'http://localhost:5174/app/' : '/app';
                const token = localStorage.getItem('authToken');
                const redirectUrl = token ? `${backofficeUrlBase}?token=${encodeURIComponent(token)}` : backofficeUrlBase;

                return (
                    <>
                        <a href={redirectUrl} title="Acessar Backoffice" className="menu-btn" style={{ textDecoration: 'none' }}>
                            <span className="material-symbols-outlined">admin_panel_settings</span>
                            BACKOFFICE
                        </a>
                        <button className="menu-btn" onClick={handleLogout}>SAIR</button>
                    </>
                );
            } else { // Assumed client role
                return (
                    <>
                        <a href="#" title={`Conta de ${userName}`} className="menu-btn" onClick={(e) => { e.preventDefault(); alert('Página Minha Conta (Cliente) - Não implementado.'); }}>
                            <span className="material-symbols-outlined">account_circle</span>
                        </a>
                        <button className="menu-btn" onClick={handleLogout}>SAIR</button>
                    </>
                );
            }
        } else {
            return (
                <>
                    <button className="menu-btn" onClick={() => openAuthModal('login')}>
                        ENTRAR
                    </button>
                    <button className="menu-btn" onClick={() => openAuthModal('register')}>
                        CRIAR CONTA
                    </button>
                </>
            );
        }
    };


    return (
        <>
            {/* --- Sidebar and AuthModal (Reused) --- */}
            <LiquidGlassSidebar
              isOpen={isSidebarOpen}
              onClose={handleCloseSidebar}
              userName={user.name || 'Visitante'}
            />
            <AuthModal
              isOpen={isAuthModalOpen}
              onClose={closeAuthModal}
            />

            {/* --- Navigation (Adapted from HomePage) --- */}
             <nav ref={mainNavRef} className={`main-nav ${isNavSticky ? 'nav-is-sticky' : ''}`}>
                 <div className="nav-left">
                     <button className="menu-btn" onClick={() => setIsSidebarOpen(true)}>
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
                    <a href="#" title="Localização"><span className="material-symbols-outlined">location_on</span></a>
                    <a href="#" title="Favoritos"><span className="material-symbols-outlined">favorite</span></a>
                    <a href="#" title="Carrinho"><span className="material-symbols-outlined">shopping_cart</span></a>
                    {renderAuthSection()}
                 </div>
             </nav>

            {/* --- Rock Page Specific Hero Section --- */}
            <header className={styles.rockHeroSection}>
                 {/* Optional overlay if needed for text contrast */}
                 {/* <div className={styles.heroOverlay}></div> */}
                 <div className={styles.heroContent}>
                     <p className={styles.breadcrumbs}>Home / Rock</p>
                     <h1 className={styles.heroTitle}>ROCK</h1>
                     {/* Add subtitle or description if desired */}
                 </div>
            </header>

            {/* --- Main Content Area for Products --- */}
            <main className={styles.pageContent}>
                {loading && <p className={styles.loadingMessage}>Carregando produtos...</p>}
                {error && <p className={styles.errorMessage}>{error}</p>}
                {!loading && !error && products.length === 0 && (
                    <p className={styles.noProductsMessage}>Nenhum produto de Rock encontrado.</p>
                )}
                {!loading && !error && products.length > 0 && (
                    <div className={styles.productGrid}>
                        {products.map(product => (
                            <div key={product._id} className={styles.productCard}>
                                <img
                                    src={`/uploads/${product.imagem}`} // Ensure this path is correct
                                    alt={`${product.nome} - ${product.artista}`}
                                    className={styles.productImage}
                                    onError={(e) => { e.target.src = '/path/to/placeholder.png'; }} // Basic placeholder on error
                                />
                                <h3 className={styles.productTitle}>{product.nome}</h3>
                                <p className={styles.productArtist}>{product.artista}</p>
                                {/* Add description if available: <p className={styles.productDescription}>{product.description}</p> */}
                                <p className={styles.productPrice}>
                                    R$ {product.preco?.toFixed(2) ?? '0.00'}
                                </p>
                                {/* Add "Add to Cart" button later */}
                                <button className={styles.addToCartButton}>Adicionar ao Carrinho</button>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* --- Footer (Assuming similar structure to HomePage) --- */}
            <footer>
                <div className="footer-container">
                    {/* Column 1: Newsletter */}
                    <div className="footer-column">
                        <h3>Junte-se a nós</h3>
                        <p>Cadastre seu e-mail e receba 50% de desconto na primeira compra</p>
                        <form className="newsletter-form">
                            <input type="text" placeholder="Nome" required />
                            <input type="email" placeholder="E-mail" required />
                            <button type="submit" className="newsletter-button" style={{ padding: '10px 15px', marginTop: '10px', cursor: 'pointer', background: '#333', color: '#fff', border: 'none', borderRadius: '4px' }}>Inscrever</button>
                        </form>
                    </div>
                    {/* Column 2: Categories */}
                    <div className="footer-column">
                        <h3>Categorias</h3>
                        <ul>
                            <li><a href="/rock">Rock</a></li>
                            <li><a href="/bossa-nova">Bossa nova</a></li> {/* Update links later */}
                            <li><a href="/jazz-blues">Jazz e Blues</a></li> {/* Update links later */}
                        </ul>
                    </div>
                    {/* Column 3: Contact */}
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

export default RockPage;