// storefront/src/pages/ProductDetailPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import styles from '../assets/css/ProductDetailPage.module.css'; // Usa o CSS Module

// --- Imports da RockPage/HomePage (Lógica V2) ---
import { useAuth } from '../context/AuthContext.jsx';
import LiquidGlassSidebar from '../components/LiquidGlassSidebar';
import AuthModal from '../components/AuthModal';
import FavoritesPopup from '../components/FavoritesPopup';
import QuantitySelector from '../components/QuantitySelector.jsx';

// --- Imports DOS FOOTERS DINÂMICOS (Lógica V2) ---
import RockFooter from '../components/RockFooter';
import BossaNovaFooter from '../components/BossaNovaFooter';
import JazzBluesFooter from '../components/JazzBluesFooter';

// <<< 1. LÓGICA INCORPORADA (V1) - IMPORTAR O CONTEXTO DO CARRINHO >>>
import { useCart } from '../context/CartContext'; 

// --- Caminho do logo ---
const logoWhitePath = '/listen-white.svg';

/**
 * --- LÓGICA DE COMPONETIZAÇÃO (Versão Robusta V2) ---
 * Esta função decide qual tema carregar.
 */
const getDynamicConfig = (genreString) => {
  const lowerGenre = (genreString || 'rock').toLowerCase();

  // Se incluir "bossa", usa o tema Bossa Nova
  if (lowerGenre.includes('bossa')) {
    return {
      pageClass: styles.bossaNovaPage,
      FooterComponent: BossaNovaFooter,
    };
  }
  
  // Se incluir "jazz", usa o tema Jazz
  if (lowerGenre.includes('jazz')) {
    return {
      pageClass: styles.jazzPage,
      FooterComponent: JazzBluesFooter,
    };
  }
  
  // Caso contrário, usa o tema Rock
  return {
    pageClass: styles.rockPage,
    FooterComponent: RockFooter,
  };
};


const ProductDetailPage = () => {
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();

  // --- State e Lógica de Layout (Lógica V2) ---
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
  const [isNavSticky, setIsNavSticky] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const mainNavRef = useRef(null);
  const userMenuRef = useRef(null);

  // <<< 2. LÓGICA INCORPORADA (V1) - ESTADO DE QUANTIDADE E FUNÇÃO DO CARRINHO >>>
  const [quantity, setQuantity] = useState(1); // Estado local para a quantidade
  const { addToCart } = useCart(); // Usar o contexto e pegar a função

  // --- UseEffects e Handlers (Lógica V2) ---
  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      setError(null);
      setRelatedProducts([]); 
      
      try {
        const response = await api.get(`/produtos/${id}`);
        const mainProduct = response.data;
        setProduct(mainProduct);

        // Recomendações por Gênero (Lógica V2)
        const productGenre = mainProduct.genero || mainProduct.categoria;
        if (productGenre) {
          const relatedResponse = await api.get(`/produtos?genero=${productGenre}&limite=5`);
          const filtered = relatedResponse.data
            .filter(p => p._id !== mainProduct._id)
            .slice(0, 4);
          setRelatedProducts(filtered);
        }

      } catch (error) {
        console.error('Erro ao buscar detalhes do produto:', error);
        setError('Não foi possível carregar o produto.');
      } finally {
        setLoading(false);
      }
    };
    fetchProductData();
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      setIsNavSticky(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const handleCloseSidebar = () => setIsSidebarOpen(false);
  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  // Lógica de Favoritos (Lógica V2)
  const handleToggleFavorite = (e, produtoId) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!isAuthenticated) { 
          setShowAuthModal(true);
          return;
      }
      
      const isFavorito = favorites?.some(fav => fav._id === produtoId);
      if (isFavorito) {
          removeFavorite(produtoId);
      } else {
          addFavorite(produtoId);
      }
  };

  // <<< 3. LÓGICA INCORPORADA (V1) - HANDLERS PARA QUANTIDADE E CARRINHO >>>
  // Função para controlar o seletor de quantidade
  const handleQuantityChange = (amount) => {
    // Garante que a quantidade não seja menor que 1
    setQuantity(prev => Math.max(1, prev + amount)); 
  };

  // Função para adicionar ao carrinho
  const handleAddToCart = () => {
    if (product) {
      // Chama a função do contexto com o produto (da API) e a quantidade (do estado)
      addToCart(product, quantity);
      
      // (Opcional) Mostra um feedback para o usuário
      alert(`${quantity} "${product.nome}" adicionado(s) ao carrinho!`);
    }
  };
  // --- Fim da Lógica (V1) ---


  // Render Functions (Lógica V2)
  const renderUserSection = () => {
    // ... (Seu código de renderUserSection sem alteração) ...
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
          title={isAuthenticated ? `Conta de ${user?.name}` : "Entrar ou Criar Conta"}
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

  const renderProductCard = (product) => {
    // ... (Seu código de renderProductCard sem alteração) ...
    const isFavorito = isAuthenticated && favorites?.some(fav => fav._id === product._id);
    return (
        <Link
          to={`/produto/${product._id}`}
          key={product._id}
          className={styles.productCardLink} 
        >
          <div className={styles.productCard}>
            <img
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
                  onClick={(e) => handleToggleFavorite(e, product._id)}
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

  // --- Renderização ---

  // Feedback de Carregamento / Erro (Lógica V2)
  if (loading) {
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '5rem', fontSize: '1.5rem', background: '#000', height: '100vh' }}>Carregando...</div>;
  }
  if (error) {
      return <div style={{ color: 'red', textAlign: 'center', marginTop: '5rem', fontSize: '1.5rem', background: '#000', height: '100vh' }}>{error}</div>;
  }
  if (!product) {
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '5rem', fontSize: '1.5rem', background: '#000', height: '100vh' }}>Produto não encontrado.</div>;
  }

  // URL da imagem (Lógica V2)
  const imageUrl = `http://localhost:3000/uploads/${product.imagem}`;

  // Verifica se o produto principal é favorito (Lógica V2)
  const isMainFavorite = isAuthenticated && favorites?.some(fav => fav._id === product._id);


  // LÓGICA DE COMPONETIZAÇÃO (Lógica V2)
  const { pageClass, FooterComponent } = getDynamicConfig(product.genero || product.categoria);


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
      <FavoritesPopup
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
      />

      {/* --- WRAPPER DINÂMICO (Lógica V2) --- */}
      <div className={`${styles.pageContainer} ${pageClass}`}>

        {/* --- Navigation Bar (Lógica V2) --- */}
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
            <Link to="/" className={styles.logoContainer}>
              <img src={logoWhitePath} alt="Listen." className={styles.logoSvg} />
            </Link>
          </div>

          <div className={styles.navRight}>
            <a href="#" title="Localização"><span className="material-symbols-outlined">location_on</span></a>
            
            {isAuthenticated && (
              <button title="Favoritos" className={styles.menuBtn} onClick={() => setIsFavoritesOpen(true)}>
                <span className="material-symbols-outlined">favorite</span>
              </button>
            )}

            {/* O link do carrinho da V2 ainda está aqui, mas o botão de adicionar chama o contexto */}
            <a href="#" title="Carrinho"><span className="material-symbols-outlined">shopping_cart</span></a>
            {renderUserSection()}
          </div>
        </nav>

        {/* --- Header Section (Lógica V2) --- */}
        <header className={styles.rockHeroSection}>
          <div className={styles.heroContent}>
            <p className={styles.breadcrumbs}>
              <Link to="/">Home</Link> / 
              {(product.genero || product.categoria) && (
                <><Link to={`/${(product.genero || product.categoria).toLowerCase().replace(' ', '-')}`}>{product.genero || product.categoria}</Link> / </>
              )}
              {product.nome}
            </p>
          </div>
        </header>

        {/* --- Main Content Area (Lógica V2) --- */}
        <main className={styles.pageContent}>
        
          {/* --- Container Principal do Produto (Lógica V2) --- */}
          <div className={styles.detailContainer}>
            
            <div className={styles.detailImageColumn}>
              <div className={styles.detailImageWrapper}>
                <img src={imageUrl} alt={product.nome} />
                
                {(product.quantidade <= 0) && (
                  <div className={styles.soldOutOverlay}>
                    <span className={styles.soldOutText}>Esgotado</span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.detailInfoColumn}>
              
              <div className={styles.detailHeader}>
                <h1 className={styles.detailTitle}>
                  {product.artista} - {product.nome}
                </h1>
                <button 
                  className={`${styles.detailFavoriteButton} ${isMainFavorite ? styles.isFavorite : ''}`}
                  aria-label={isMainFavorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
                  onClick={(e) => handleToggleFavorite(e, product._id)}
                >
                  <span className={`${styles.iconOutline} material-symbols-outlined`}>favorite_border</span>
                  <span className={`${styles.iconFilled} material-symbols-outlined`}>favorite</span>
                </button>
              </div>
              
              <p className={styles.detailPrice}>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(product.preco)}
              </p>
              
              <p className={`${styles.detailStock} ${product.quantidade <= 0 ? styles.outOfStock : ''}`}>
                {product.quantidade > 0 ? 'Disponível' : 'Indisponível'}
              </p>

              <div className={styles.detailDescription}>
                <p>{product.descricao}</p>
              </div>

              {/* <<< 4. LÓGICA INCORPORADA (V1) - SELETOR DE QUANTIDADE (UI) >>> */}
              {/* (Assumindo que as classes 'quantitySelector' etc. existem no seu CSS Module) */}
              {/* 2. Substituir o seletor de quantidade antigo pelo novo componente */}
            <div className={styles.controls}>
              <QuantitySelector 
                quantity={quantity}
                onDecrease={() => setQuantity(q => Math.max(1, q - 1))}
                onIncrease={() => setQuantity(q => q + 1)}
              />
            </div>
            {/* --- FIM DA MUDANÇA --- */}
              {/* --- Fim da Lógica (V1) --- */}


              <div className={styles.detailButtonContainer}>
                <button 
                  className={styles.detailAddToCartButton}
                  disabled={product.quantidade <= 0}
                  // <<< 5. LÓGICA INCORPORADA (V1) - CONECTANDO O BOTÃO AO onClick >>>
                  onClick={handleAddToCart}
                >
                  {product.quantidade > 0 ? 'ADICIONAR AO CARRINHO' : 'ESGOTADO'}
                </button>
              </div>
              
            </div>
          </div>

          {/* --- Seção de Produtos Parecidos (Lógica V2) --- */}
          {relatedProducts.length > 0 && (
            <div className={styles.relatedProductsSection}>
              <h2 className={styles.relatedTitle}>Produtos Parecidos</h2>
              <div className={styles.relatedProductsGrid}>
                {relatedProducts.map(renderProductCard)}
              </div>
            </div>
           )}

        </main>
        
        {/* --- Footer Dinâmico (Lógica V2) --- */}
        <FooterComponent />

      </div> {/* --- FIM DO WRAPPER DINÂMICO --- */}

    </>
  );
};

export default ProductDetailPage;