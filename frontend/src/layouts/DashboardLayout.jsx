import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { jwtDecode } from 'jwt-decode';

function DashboardLayout() {
    const [user, setUser] = useState({ name: 'Carregando...', role: '' });
    const [isSidebarOpen, setSidebarOpen] = useState(false); // Estado para controlar o menu
    const location = useLocation();

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setUser({ name: decodedToken.name, role: decodedToken.role });
            } catch (error) {
                console.error("Token inválido:", error);
            }
        }
    }, []);
    
    // Fecha o menu lateral sempre que a rota mudar
    useEffect(() => {
        setSidebarOpen(false);
    }, [location]);


    const pageTitle = location.pathname.split('/').pop().replace(/^\w/, c => c.toUpperCase());
    const finalTitle = pageTitle === 'Admin' ? 'Utilizadores' : pageTitle;

    return (
        <div className="app-wrapper">
            {/* Overlay para ecrãs pequenos */}
            <div 
                className={`mobile-overlay ${isSidebarOpen ? 'show' : ''}`} 
                onClick={() => setSidebarOpen(false)}
            ></div>

            <Sidebar userRole={user.role} isOpen={isSidebarOpen} />
            
            <div className="main-content-wrapper">
                <Header 
                    user={user} 
                    title={finalTitle} 
                    onMenuClick={() => setSidebarOpen(!isSidebarOpen)} 
                />
                <main className="content-area">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default DashboardLayout;