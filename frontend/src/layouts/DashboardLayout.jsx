// frontend/src/layouts/DashboardLayout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { jwtDecode } from 'jwt-decode';

function DashboardLayout() {
    // Define um usuário padrão para modo dev sem token
    const defaultDevUser = { name: 'Dev User', role: 'adm' }; // Ou 'vendas' se preferir
    const [user, setUser] = useState(import.meta.env.DEV ? defaultDevUser : { name: 'Carregando...', role: '' });
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        const isDevelopment = import.meta.env.DEV;

        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                const currentTime = Date.now() / 1000;

                if (decodedToken.exp < currentTime) {
                    console.error("Token expirado.");
                    localStorage.removeItem('authToken');
                    // Redireciona APENAS se NÃO estiver em modo dev OU se quiser forçar auth em dev
                    if (!isDevelopment) navigate('/');
                    else setUser(defaultDevUser); // Mantém usuário dev se token expirar em dev
                    return;
                }
                // Define o usuário com os dados do token
                setUser({ name: decodedToken.name, role: decodedToken.role });

            } catch (error) {
                console.error("Token inválido:", error);
                localStorage.removeItem('authToken');
                if (!isDevelopment) navigate('/');
                else setUser(defaultDevUser); // Mantém usuário dev se token inválido em dev
            }
        } else {
             // Se NÃO há token E NÃO está em modo dev, redireciona
             if (!isDevelopment) {
                 console.log("Sem token em produção, redirecionando...");
                 navigate('/');
             } else {
                 // Em modo dev, usa o usuário padrão se não houver token
                 console.warn("MODO DEV: Sem token encontrado, usando usuário padrão.");
                 setUser(defaultDevUser);
             }
        }
    // Adiciona isDevelopment como dependência para reavaliar se necessário
    }, [navigate, location.key, import.meta.env.DEV]); // location.key pode ajudar a re-executar em navegação

    // Restante do componente (useEffect para sidebar, pageTitle, return...)
    // ... (o código restante do seu DashboardLayout) ...

    useEffect(() => {
        setSidebarOpen(false);
    }, [location]);

    const pageTitle = location.pathname.split('/').pop().replace(/^\w/, c => c.toUpperCase());
    // Ajuste no título padrão
    const finalTitle = pageTitle === 'App' || !pageTitle ? 'Produtos' : (pageTitle === 'Admin' ? 'Utilizadores' : pageTitle);

    return (
        <div className="app-wrapper">
            <div
                className={`mobile-overlay ${isSidebarOpen ? 'show' : ''}`}
                onClick={() => setSidebarOpen(false)}
            ></div>
            {/* Garante que user.role tenha um valor válido */}
            <Sidebar userRole={user.role || (import.meta.env.DEV ? 'adm' : '')} isOpen={isSidebarOpen} />
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