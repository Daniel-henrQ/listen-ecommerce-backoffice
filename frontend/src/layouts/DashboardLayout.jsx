// frontend/src/layouts/DashboardLayout.jsx
import React, { useState, useEffect, useContext } from 'react'; // Adicionar useContext
import { Outlet, useLocation, Navigate } from 'react-router-dom'; // Remover useNavigate
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { AuthContext } from '../context/AuthContext'; // Importar AuthContext
// Remover jwtDecode se não for mais usado
// import { jwtDecode } from 'jwt-decode';

function DashboardLayout() {
    const { user } = useContext(AuthContext); // Obter user do contexto
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    // useNavigate não é mais necessário aqui para verificar token

    // Remover o useEffect que verificava o token localmente
    /* useEffect(() => { ... }, [navigate, location.key]); */

    // O AuthProvider agora garante que só renderizamos se autenticado
    // Se por algum motivo o contexto indicar não autenticado (ex: logout),
    // o PrivateRoute já terá redirecionado.

    useEffect(() => {
        // Fecha a sidebar em navegação mobile
        setSidebarOpen(false);
    }, [location]);

    // Lógica do título permanece
    const pageTitle = location.pathname.split('/').pop().replace(/^\w/, c => c.toUpperCase());
    const finalTitle = pageTitle === 'App' || !pageTitle ? 'Produtos' : (pageTitle === 'Admin' ? 'Utilizadores' : pageTitle);

    // Se o contexto ainda está a carregar, pode mostrar um loader
     if (user.isLoading) {
         return <div>A carregar...</div>;
     }

     // Se por algum motivo não estiver autenticado aqui (improvável devido ao PrivateRoute), redireciona
     if (!user.isAuthenticated) {
         console.log("DashboardLayout: Utilizador não autenticado, redirecionando...");
          // Usar window.location.href para garantir saída do /app/
          window.location.href = '/';
         return null;
     }


    return (
        <div className="app-wrapper">
            <div
                className={`mobile-overlay ${isSidebarOpen ? 'show' : ''}`}
                onClick={() => setSidebarOpen(false)}
            ></div>
            {/* Usa a role do contexto */}
            <Sidebar userRole={user.role} isOpen={isSidebarOpen} />
            <div className="main-content-wrapper">
                <Header
                    user={user} // Passa o objeto user completo do contexto
                    title={finalTitle}
                    onMenuClick={() => setSidebarOpen(!isSidebarOpen)}
                />
                <main className="content-area">
                    <Outlet /> {/* Renderiza a página da rota atual */}
                </main>
            </div>
        </div>
    );
}

export default DashboardLayout;