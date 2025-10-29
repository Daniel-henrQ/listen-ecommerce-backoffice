// storefront/src/pages/ProductDetailPage.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import styles from '../assets/css/ProductDetailPage.module.css'; // Usa o novo CSS Module

// --- Imports da RockPage/HomePage ---
import { AuthContext } from '../context/AuthContext.jsx';
import LiquidGlassSidebar from '../components/LiquidGlassSidebar';
import AuthModal from '../components/AuthModal';
import FavoritesPopup from '../components/FavoritesPopup'; // <-- ADICIONADO

// --- Caminho do logo ---
const logoWhitePath = '/listen-white.svg';

const ProductDetailPage = () => {
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();

  // --- State e Lógica de Layout (da RockPage) ---
  const { user, logout, favoritos, addFavorito, removeFavorito } = useContext(AuthContext); // <-- ADICIONADO
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isNavSticky, setIsNavSticky] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false); // <-- ADICIONADO
  const mainNavRef = useRef(null);
  const userMenuRef = useRef(null);

  // (O resto dos hooks useEffect e handlers permanecem os mesmos)
  // ... (useEffect fetchProductData)
  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      setError(null);
      setRelatedProducts([]); 
      
      try {
        const response = await api.get(`/produtos/${id}`);
        const mainProduct = response.data;
        setProduct(mainProduct);

        if (mainProduct.categoria) {
          const relatedResponse = await api.get(`/produtos?categoria=${mainProduct.categoria}&limite=5`);
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

  // ... (useEffect handleScroll)
  useEffect(() => {
    const handleScroll = () => {
      setIsNavSticky(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ... (useEffect handleClickOutside)
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

  // ... (Handlers: handleCloseSidebar, openAuthModal, closeAuthModal, handleLogout)
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

  // --- NOVO HANDLER DE FAVORITOS (GERAL) ---
  const handleToggleFavorite = (e, produtoId) => {
      e.preventDefault(); // Previne ação do link
      e.stopPropagation(); // Previne ação do card
      
      if (!user.isAuthenticated) {
          openAuthModal('login');
          return;
      }
      
      const isFavorito = favoritos.some(fav => fav._id === produtoId);
      if (isFavorito) {
          removeFavorito(produtoId);
      } else {
          addFavorito(produtoId);
      }
  };


  // ... (renderUserSection)
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
      </div>
    );
  };

  // ... (renderProductCard ATUALIZADO)
  const renderProductCard = (product) => {
    // Verifica se este card específico é favorito
    const isFavorito = favoritos.some(fav => fav._id === product._id);

    return (
        <Link
          to={`/produto/${product._id}`}
          key={product._id}
          className={styles.productCardLink} 
        >
          <div className={styles.productCard}>
            <img
              src={`http://localhost:3000/uploads/${product.imagem}`} // Padronizado com RockPage (porta 3000)
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
                {/* BOTÃO ATUALIZADO */}
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

  // Feedback de Carregamento / Erro
  if (loading) {
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '5rem', fontSize: '1.5rem', background: '#000', height: '100vh' }}>Carregando...</div>;
  }
  if (error) {
     return <div style={{ color: 'red', textAlign: 'center', marginTop: '5rem', fontSize: '1.5rem', background: '#000', height: '100vh' }}>{error}</div>;
  }
  if (!product) {
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '5rem', fontSize: '1.5rem', background: '#000', height: '100vh' }}>Produto não encontrado.</div>;
  }

  // URL da imagem (apontando para 3000)
  const imageUrl = `http://localhost:3000/uploads/${product.imagem}`;

  // Verifica se o produto principal é favorito
  const isMainFavorite = favoritos.some(fav => fav._id === product._id);

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
      {/* --- POPUP DE FAVORITOS --- */}
      <FavoritesPopup
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
      />

      {/* --- Navigation Bar (Base RockPage) --- */}
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
        
        {/* --- Centro da Nav (Logo Branco) --- */}
        <div className={styles.navCenter}>
          <Link to="/" className={styles.logoContainer}>
            <img src={logoWhitePath} alt="Listen." className={styles.logoSvg} />
          </Link>
        </div>

        <div className={styles.navRight}>
          <a href="#" title="Localização"><span className="material-symbols-outlined">location_on</span></a>
          
          {/* --- BOTÃO DE FAVORITOS DA NAV (ATUALIZADO) --- */}
          {user.isAuthenticated && (
            <button title="Favoritos" className={styles.menuBtn} onClick={() => setIsFavoritesOpen(true)}>
                <span className="material-symbols-outlined">favorite</span>
            </button>
          )}

          <a href="#" title="Carrinho"><span className="material-symbols-outlined">shopping_cart</span></a>
          {renderUserSection()}
        </div>
      </nav>

      {/* --- Header Section (Breadcrumbs) --- */}
      <header className={styles.rockHeroSection}>
        <div className={styles.heroContent}>
          <p className={styles.breadcrumbs}>
            <Link to="/">Home</Link> / 
            {product.categoria && (
              <><Link to={`/${product.categoria.toLowerCase().replace(' ', '-')}`}>{product.categoria}</Link> / </>
            )}
            {product.nome}
          </p>
        </div>
      </header>

      {/* --- Main Content Area --- */}
      <main className={styles.pageContent}>
      
        {/* --- Container Principal do Produto (Classes renomeadas) --- */}
        <div className={styles.detailContainer}>
          
          {/* === COLUNA DA IMAGEM ATUALIZADA === */}
          <div className={styles.detailImageColumn}>
            {/* Wrapper para Imagem + Overlay */}
            <div className={styles.detailImageWrapper}>
              <img src={imageUrl} alt={product.nome} />
              
              {/* Overlay de Esgotado (Condicional) */}
              {(product.quantidade <= 0) && (
                <div className={styles.soldOutOverlay}>
                  <span className={styles.soldOutText}>Esgotado</span>
                </div>
              )}
            </div>
          </div>
          {/* === FIM DA COLUNA DA IMAGEM === */}


          {/* === COLUNA DE INFORMAÇÕES === */}
          <div className={styles.detailInfoColumn}>
            
            {/* 1. Wrapper Título + Favorito */}
            <div className={styles.detailHeader}>
              <h1 className={styles.detailTitle}>
                {product.artista} - {product.nome}
              </h1>
              {/* Botão de Favoritar (ATUALIZADO) */}
              <button 
                className={`${styles.detailFavoriteButton} ${isMainFavorite ? styles.isFavorite : ''}`}
                aria-label={isMainFavorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
                onClick={(e) => handleToggleFavorite(e, product._id)}
              >
                <span className={`${styles.iconOutline} material-symbols-outlined`}>favorite_border</span>
                <span className={`${styles.iconFilled} material-symbols-outlined`}>favorite</span>
              </button>
            </div>
            
            {/* 2. Preço */}
            <p className={styles.detailPrice}>
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(product.preco)}
            </p>
            
            {/* 3. Estoque (com classe condicional) */}
            <p className={`${styles.detailStock} ${product.quantidade <= 0 ? styles.outOfStock : ''}`}>
              {product.quantidade > 0 ? 'Disponível' : 'Indisponível'}
            </p>

            {/* 4. Descrição (sem H2) */}
            <div className={styles.detailDescription}>
              <p>{product.descricao}</p>
            </div>

            {/* 5. Botão */}
            <div className={styles.detailButtonContainer}>
              <button 
                className={styles.detailAddToCartButton}
                disabled={product.quantidade <= 0} // Desabilita o botão se esgotado
              >
                {product.quantidade > 0 ? 'ADICIONAR AO CARRINHO' : 'ESGOTADO'}
              </button>
            </div>
            
          </div>
          {/* === FIM DA COLUNA DE INFORMAÇÕES === */}
        </div>

        {/* --- Seção de Produtos Parecidos --- */}
        {relatedProducts.length > 0 && (
          <div className={styles.relatedProductsSection}>
            <h2 className={styles.relatedTitle}>Produtos Parecidos</h2>
            <div className={styles.relatedProductsGrid}>
              {/* Usa a função renderProductCard da RockPage */}
              {relatedProducts.map(renderProductCard)}
            </div>
          </div>
        )}

      </main>

      {/* --- Footer (da RockPage) --- */}
      <footer className={styles.rockFooter}>
        <div className={styles.footerContainer}>
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
};

export default ProductDetailPage;