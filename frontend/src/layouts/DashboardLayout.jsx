import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { jwtDecode } from 'jwt-decode';

function DashboardLayout() {
    const [user, setUser] = useState({ name: 'Carregando...', role: '' });
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

    // Pega o nome da rota atual para usar como título no header
    const currentRouteName = location.pathname.split('/').pop();
    const pageTitle = currentRouteName.charAt(0).toUpperCase() + currentRouteName.slice(1);


    return (
        <div className="app-wrapper">
            <Sidebar userRole={user.role} />
            <div className="main-content-wrapper">
                <Header user={user} title={pageTitle === 'Admin' ? 'Utilizadores' : pageTitle} />
                <main className="content-area">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default DashboardLayout;