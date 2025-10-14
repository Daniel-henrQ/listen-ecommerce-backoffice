import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket'; // Importa nosso hook de notificações

function Header({ user, title }) {
    const navigate = useNavigate();
    const { notifications, unreadCount, markAsRead } = useSocket();
    const [userDropdownVisible, setUserDropdownVisible] = useState(false);
    const [notificationPanelVisible, setNotificationPanelVisible] = useState(false);
    
    const handleLogout = () => {
        localStorage.removeItem('authToken');
        navigate('/login');
    };

    const toggleNotificationPanel = () => {
        const isVisible = !notificationPanelVisible;
        setNotificationPanelVisible(isVisible);
        if (isVisible && unreadCount > 0) {
            markAsRead();
        }
    };
    
    return (
        <header className="header-fixed">
            <h1>{title}</h1>
            <div className="header-actions">
                <div className="notification-icon" onClick={toggleNotificationPanel}>
                    <svg className="header-icon" viewBox="0 0 24 24">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    <span className={`notification-badge ${unreadCount > 0 ? 'show' : ''}`}>{unreadCount}</span>
                </div>
                <div className={`dropdown-notification-menu ${notificationPanelVisible ? 'show' : ''}`}>
                    <div className="notification-header"><h3>Notificações</h3></div>
                    <ul className="notification-list">
                        {/* CORREÇÃO: Adicionada verificação para garantir que 'notifications' é um array */}
                        {notifications && notifications.length > 0 ? (
                            notifications.map(notif => (
                                <li key={notif._id} className={!notif.lida ? 'unread' : ''}>{notif.mensagem}</li>
                            ))
                        ) : (
                            <li className="empty-state">Nenhuma notificação.</li>
                        )}
                    </ul>
                </div>

                <div className="user-profile" onClick={() => setUserDropdownVisible(!userDropdownVisible)}>
                    <div className="user-details">
                        <span className="user-name">{user.name}</span>
                        <span className="user-role">{user.role === 'adm' ? 'CEO ADM' : 'Vendedor'}</span>
                    </div>
                    <div className={`dropdown-user-menu ${userDropdownVisible ? 'show' : ''}`}>
                        <a href="#" onClick={handleLogout}>Sair</a>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;