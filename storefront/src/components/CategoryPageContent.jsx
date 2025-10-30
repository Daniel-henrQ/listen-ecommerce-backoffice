import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import styles from '../assets/css/CategoryPages.module.css';

function CategoryPageContent({ categoryName, mainClassName }) {
    
    // --- Estados para conteúdo e loading ---
    const [productsRow1, setProductsRow1] = useState([]);
    const [productsRow2, setProductsRow2] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Estados e Refs para o Carrossel ---
    const trackRef1 = useRef(null);
    const trackRef2 = useRef(null);
    const [isRow1Transitioning, setIsRow1Transitioning] = useState(true);
    const [isRow2Transitioning, setIsRow2Transitioning] = useState(true);
    // O carrossel com loop infinito começa no slide 1 (o primeiro item real)
    const [currentSlideRow1, setCurrentSlideRow1] = useState(1);
    const [currentSlideRow2, setCurrentSlideRow2] = useState(1);

    // --- Contexto de Autenticação para Favoritos ---
    const { 
        isAuthenticated, 
        favorites, 
        addFavorite, 
        removeFavorite, 
        setShowAuthModal 
    } = useAuth();

    // --- Fetch de Produtos (com correção para nomes com espaço) ---
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            setError(null);
            try {
                // CORREÇÃO 1: Garantir que nomes como "Bossa Nova" sejam codificados para a URL
                const encodedCategory = encodeURIComponent(categoryName);
                const response = await api.get(`/produtos?categoria=${encodedCategory}`); 
                
                const allProducts = response.data;
                const midpoint = Math.ceil(allProducts.length / 2);
                setProductsRow1(allProducts.slice(0, midpoint));
                setProductsRow2(allProducts.slice(midpoint));

            } catch (err) {
                console.error(`Error fetching ${categoryName} products:`, err);
                setError(`Não foi possível carregar os produtos de ${categoryName}.`);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [categoryName]); // Re-executa se o nome da categoria mudar

    // --- Lógica de Slides por Viewport ---
    const getProductsPerSlide = () => {
        if (window.innerWidth <= 768) { return 1; }
        if (window.innerWidth <= 1024) { return 2; }
        return 3; 
    };
    const [productsPerSlide, setProductsPerSlide] = useState(getProductsPerSlide());
    
    // Calcula o número de slides REAIS
    const realTotalSlidesRow1 = Math.ceil(productsRow1.length / productsPerSlide);
    const realTotalSlidesRow2 = Math.ceil(productsRow2.length / productsPerSlide);

    // --- Lógica de Redimensionamento (Resize) ---
    useEffect(() => {
        const handleResize = () => {
            setProductsPerSlide(getProductsPerSlide());
        };
        handleResize();
        // Reseta para o primeiro slide real (índice 1)
        setIsRow1Transitioning(false);
        setIsRow2Transitioning(false);
        setCurrentSlideRow1(1);
        setCurrentSlideRow2(1);
        // Reativa transições
        requestAnimationFrame(() => {
            setIsRow1Transitioning(true);
            setIsRow2Transitioning(true);
        });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []); // Array vazio, executa apenas no mount/unmount

    // --- Lógica de Navegação (Handlers) ---
    // Linha 1
    const nextSlideRow1 = () => { setIsRow1Transitioning(true); setCurrentSlideRow1(p => p + 1); };
    const prevSlideRow1 = () => { setIsRow1Transitioning(true); setCurrentSlideRow1(p => p - 1); };
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
    // Linha 2
    const nextSlideRow2 = () => { setIsRow2Transitioning(true); setCurrentSlideRow2(p => p + 1); };
    const prevSlideRow2 = () => { setIsRow2Transitioning(true); setCurrentSlideRow2(p => p - 1); };
    const handleTransitionEndRow2 = () => {
        if (currentSlideRow2 === realTotalSlidesRow2 + 1) { setIsRow2Transitioning(false); setCurrentSlideRow2(1); }
        if (currentSlideRow2 === 0) { setIsRow2Transitioning(false); setCurrentSlideRow2(realTotalSlidesRow2); }
    };

    // --- Renderização do Card de Produto ---
    const renderProductCard = (product) => {
        const isFavorito = isAuthenticated && favorites?.some(fav => fav._id === product._id);

        const handleToggleFavorite = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isAuthenticated) { setShowAuthModal(true); return; }
            if (isFavorito) { removeFavorite(product._id); } 
            else { addFavorite(product._id); }
        };

        return (
            <Link to={`/produto/${product._id}`} key={product._id} className={styles.productLink}>
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

    // --- Renderização de Placeholders (para slides incompletos) ---
    const renderPlaceholders = (slideIndex, products, rowNum) => {
        if (productsPerSlide === 1) return null; // Não precisa em mobile
        const productsInSlide = products.slice(slideIndex * productsPerSlide, (slideIndex + 1) * productsPerSlide).length;
        const placeholdersNeeded = productsPerSlide - productsInSlide;
        if (slideIndex === Math.ceil(products.length / productsPerSlide) - 1 && placeholdersNeeded > 0) {
            return Array.from({ length: placeholdersNeeded }).map((_, placeholderIndex) => (
                <div key={`placeholder-${rowNum}-${placeholderIndex}`} className={styles.productCardPlaceholder}></div>
            ));
        }
        return null;
    };

    // --- Renderização de um Slide (com produtos e placeholders) ---
    const renderSlide = (products, slideIndex, keyPrefix, rowNum) => {
        const slideProducts = products.slice(slideIndex * productsPerSlide, (slideIndex + 1) * productsPerSlide);
        if (slideProducts.length === 0) return null; // Evita renderizar clones vazios
        return (
            <div key={`${keyPrefix}-${slideIndex}`} className={styles.carouselSlide}>
                {slideProducts.map(renderProductCard)}
                {slideIndex === Math.ceil(products.length / productsPerSlide) - 1 &&
                    keyPrefix.includes('orig') &&
                    renderPlaceholders(slideIndex, products, rowNum)}
            </div>
        );
    };


    // --- JSX Principal ---
    return (
        <div className={mainClassName}> 
            <header className={styles.heroSection}>
                <div className={styles.heroContent}>
                    <p className={styles.breadcrumbs}>
                        <Link to="/">Home</Link> / {categoryName}
                    </p>
                </div>
            </header>

            <main className={styles.mainPageContent}>
                {loading && <p className={styles.loadingMessage}>Carregando produtos...</p>}
                {error && <p className={styles.errorMessage}>{error}</p>}
                {!loading && !error && productsRow1.length === 0 && (
                    <p className={styles.noProductsMessage}>Nenhum produto de {categoryName} encontrado.</p>
                )}

                {/* --- CARROSSEL LINHA 1 --- */}
                {/* CORREÇÃO 2: Renderiza o carrossel se tiver QUALQUER produto */}
                {!loading && !error && productsRow1.length > 0 && (
                    <div className={styles.carouselContainer}>
                        <div
                            ref={trackRef1}
                            className={styles.carouselTrack}
                            style={{
                                // CORREÇÃO 2: O transform volta a ser sempre ativo
                                transform: `translateX(-${currentSlideRow1 * 100}%)`,
                                transition: isRow1Transitioning ? 'transform 0.5s ease-in-out' : 'none'
                            }}
                            onTransitionEnd={handleTransitionEndRow1}
                        >
                            {/* CORREÇÃO 2: Renderiza clones e botões se realTotalSlidesRow1 > 0 */}
                            {realTotalSlidesRow1 > 0 && renderSlide(productsRow1, realTotalSlidesRow1 - 1, 'r1-clone-last', 1)}
                            {Array.from({ length: realTotalSlidesRow1 }).map((_, slideIndex) =>
                                renderSlide(productsRow1, slideIndex, `r1-orig`, 1)
                            )}
                            {realTotalSlidesRow1 > 0 && renderSlide(productsRow1, 0, 'r1-clone-first', 1)}
                        </div>
                        {realTotalSlidesRow1 > 0 && (
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
                {/* CORREÇÃO 2: Renderiza o carrossel se tiver QUALQUER produto */}
                {!loading && !error && productsRow2.length > 0 && (
                    <div className={styles.carouselContainer}>
                        <div
                            ref={trackRef2}
                            className={styles.carouselTrack}
                            style={{
                                // CORREÇÃO 2: O transform volta a ser sempre ativo
                                transform: `translateX(-${currentSlideRow2 * 100}%)`,
                                transition: isRow2Transitioning ? 'transform 0.5s ease-in-out' : 'none'
                            }}
                            onTransitionEnd={handleTransitionEndRow2}
                        >
                            {/* CORREÇÃO 2: Renderiza clones e botões se realTotalSlidesRow2 > 0 */}
                            {realTotalSlidesRow2 > 0 && renderSlide(productsRow2, realTotalSlidesRow2 - 1, 'r2-clone-last', 2)}
                            {Array.from({ length: realTotalSlidesRow2 }).map((_, slideIndex) =>
                                renderSlide(productsRow2, slideIndex, `r2-orig`, 2)
                            )}
                            {realTotalSlidesRow2 > 0 && renderSlide(productsRow2, 0, 'r2-clone-first', 2)}
                        </div>
                        {realTotalSlidesRow2 > 0 && (
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
        </div>
    );
}

export default CategoryPageContent;