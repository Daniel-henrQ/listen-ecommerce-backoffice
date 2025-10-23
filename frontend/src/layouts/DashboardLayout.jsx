// frontend/src/layouts/DashboardLayout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom'; // Importar useNavigate
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { jwtDecode } from 'jwt-decode';

function DashboardLayout() {
    const [user, setUser] = useState({ name: 'Carregando...', role: '' });
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate(); // Usar o hook useNavigate

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                // << ADIÇÃO: Validação extra do token (expiração) >>
                const currentTime = Date.now() / 1000;
                if (decodedToken.exp < currentTime) {
                    console.error("Token expirado.");
                    localStorage.removeItem('authToken');
                    navigate('/'); // Redireciona para a raiz (storefront)
                    return; // Interrompe a execução
                }
                // << FIM DA ADIÇÃO >>
                setUser({ name: decodedToken.name, role: decodedToken.role });
            } catch (error) {
                console.error("Token inválido ou erro ao decodificar:", error);
                // << ADIÇÃO: Limpar token inválido e redirecionar >>
                localStorage.removeItem('authToken');
                navigate('/'); // Redireciona para a raiz (storefront)
                // << FIM DA ADIÇÃO >>
            }
        } else {
             // Se não há token, o PrivateRoute já deve ter redirecionado,
             // mas podemos garantir o redirecionamento aqui também.
             navigate('/');
        }
    }, [navigate]); // Adicionar navigate como dependência

    useEffect(() => {
        setSidebarOpen(false);
    }, [location]);

    const pageTitle = location.pathname.split('/').pop().replace(/^\w/, c => c.toUpperCase());
    const finalTitle = pageTitle === 'Admin' ? 'Utilizadores' : pageTitle || 'Dashboard'; // Adiciona um fallback

    return (
        <div className="app-wrapper">
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