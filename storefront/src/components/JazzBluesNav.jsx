import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import styles from '../assets/css/CategoryNavs.module.css'; // <-- MUDANÇA 1: Mesmo CSS
import LiquidGlassSidebar from './LiquidGlassSidebar';
import AuthModal from './AuthModal';
import { Link } from 'react-router-dom';
import FavoritesPopup from './FavoritesPopup';

function JazzBluesNav() { // <-- MUDANÇA 2: Nome da Função
    // --- Lógica de Estado (idêntica ao RockNav) ---
    const { 
        user, 
        logout, 
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

    // --- Lógica de Efeitos (idêntica ao RockNav) ---
    useEffect(() => {
        const handleScroll = () => setIsNavSticky(window.scrollY > 10);
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

    // --- Handlers (idênticos ao RockNav) ---
    const handleCloseSidebar = () => setIsSidebarOpen(false);
    const handleLogout = () => {
        logout();
        setIsUserMenuOpen(false);
    };

    // --- Renderização do Menu de Usuário (idêntica ao RockNav) ---
    const renderUserSection = () => {
        // (Código idêntico ao RockNav.jsx)
        const handleIconClick = (event) => {
            event.stopPropagation();
            if (isAuthenticated) { setIsUserMenuOpen(prev => !prev); } 
            else { setShowAuthModal(true); } 
        };
        return (
            <div className={styles.userAccountContainer} ref={userMenuRef}>
                <button
                    className={`${styles.menuBtn} ${styles.iconOnlyBtn}`}
                    onClick={handleIconClick}
                    title={isAuthenticated ? `Conta de ${user?.nome}` : "Entrar ou Criar Conta"}
                    aria-haspopup={isAuthenticated ? "true" : "dialog"}
                    aria-expanded={isUserMenuOpen}
                >
                    <span className="material-symbols-outlined">account_circle</span>
                </button>
                {isAuthenticated && isUserMenuOpen && (
                    <div className={styles.userDropdownMenu}>
                        <ul>
                            <li><a href="#">Meus pedidos</a></li>
                            <li><a href="#">Meus dados</a></li>
                            <li><a href="#">Fale conosco</a></li>
                            <li><a href="/politica" target="_blank">Política de dados</a></li>
                            {(user?.role === 'adm' || user?.role === 'vendas') && (
                                <li className={styles.userDropdownSeparator}><a href="/app">Backoffice</a></li>
                            )}
                            <li className={styles.userDropdownSeparator}>
                                <button onClick={handleLogout} className={styles.userDropdownLogoutBtn}>Sair</button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
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

            {/* --- A NAV Componentizada --- */}
            <nav 
                ref={mainNavRef} 
                className={`
                    ${styles.mainNav} 
                    ${isNavSticky ? styles.navIsSticky : ''} 
                    ${styles.jazzNav} 
                `} // <-- MUDANÇA 3: Classe CSS
            >
                <div className={styles.navLeft}>
                    {/* (Conteúdo idêntico ao RockNav) */}
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
                    {/* --- PONTO DE VARIAÇÃO --- */}
                    <h1 className={styles.navJazzTitle}>Jazz & Blues</h1>
                </div>

                <div className={styles.navRight}>
                    {/* (Conteúdo idêntico ao RockNav) */}
                    <a href="#" title="Localização"><span className="material-symbols-outlined">location_on</span></a>
                    {isAuthenticated && (
                         <button 
                            className={`${styles.menuBtn} ${styles.iconOnlyBtn}`}
                            title="Favoritos" 
                            onClick={() => setShowFavorites(true)}
                        >
                            <span className="material-symbols-outlined">favorite</span>
                        </button>
                    )}
                    <a href="#" title="Carrinho"><span className="material-symbols-outlined">shopping_cart</span></a>
                    {renderUserSection()}
                </div>
            </nav>
        </>
    );
}

export default JazzBluesNav; // <-- MUDANÇA 2 (continuação)