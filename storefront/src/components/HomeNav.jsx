// storefront/src/components/HomeNav.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import FavoritesPopup from './FavoritesPopup';
import AuthModal from './AuthModal';

// Importa o mesmo CSS da Home, pois os estilos da Nav estão lá
import '../assets/css/HomePage.css'; 

// Caminhos para os logos
const logoWhitePath = '/listen-white.svg'; 
const logoDarkPath = '/listen.svg'; 

function HomeNav({ onOpenSidebar }) {
    const { 
        user, 
        logout, 
        isAuthenticated,
        token,         
        showAuthModal,   
        setShowAuthModal 
    } = useAuth(); 
    
    const [isNavSticky, setIsNavSticky] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [showFavorites, setShowFavorites] = useState(false);
    
    const mainNavRef = useRef(null);
    const userMenuRef = useRef(null);

    // Efeito para o scroll da nav
    useEffect(() => {
        const handleScroll = () => setIsNavSticky(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Efeito para fechar o dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };
        if (isUserMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isUserMenuOpen]); 


    // Função de Logout
    const handleLogout = () => {
        logout(); 
        setIsUserMenuOpen(false); 
    };

    // Função para renderizar o ícone de usuário
    const renderUserSection = () => {
        const handleIconClick = (event) => {
             event.stopPropagation(); 
            
            if (isAuthenticated) {
                setIsUserMenuOpen(prev => !prev);
            } else {
                setShowAuthModal(true); 
            }
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
                                <li className="user-dropdown-separator">
                                  <a 
                                    href={`http://localhost:3001/app?token=${token}`} 
                                    onClick={() => setIsUserMenuOpen(false)}
                                  >
                                    Backoffice
                                  </a>
                                </li>
                            )}

                            <li className="user-dropdown-separator"> 
                                <button onClick={handleLogout} className="user-dropdown-logout-btn"> 
                                    Sair
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <nav ref={mainNavRef} className={`main-nav ${isNavSticky ? 'nav-is-sticky' : ''}`}> 
                <div className="nav-left"> 
                    <button className="menu-btn" onClick={onOpenSidebar}> 
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
                    
                    {isAuthenticated && (
                        <button 
                            className="menu-btn icon-only-btn"
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

            {/* Modais controlados pela Nav */}
            {showFavorites && <FavoritesPopup onClose={() => setShowFavorites(false)} />}
            <AuthModal 
                isOpen={showAuthModal} 
                onClose={() => setShowAuthModal(false)} 
            />
        </>
    );
}

export default HomeNav;