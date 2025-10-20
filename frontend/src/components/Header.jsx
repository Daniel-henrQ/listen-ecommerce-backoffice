import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket'; // Importa o hook

// Recebe a função onMenuClick como propriedade
function Header({ user, title, onMenuClick }) {
    const navigate = useNavigate();
    // Obtém a nova função clearReadNotifications do hook
    const { notifications, unreadCount, markAsRead, clearReadNotifications } = useSocket();
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
            // Marca como lidas ao abrir, se houver não lidas
            markAsRead();
        }
    };

    // Função para chamar a limpeza do hook
    const handleClearRead = (e) => {
        e.stopPropagation(); // Impede que o painel feche ao clicar no botão
        clearReadNotifications();
        // Opcional: Fechar o painel após limpar?
        // setNotificationPanelVisible(false);
    };

    // Verifica se há alguma notificação lida para habilitar o botão
    const hasReadNotifications = notifications && notifications.some(n => n.lida);

    return (
        <header className="header-fixed">
            <div className="header-content-wrapper">
                {/* Botão do menu mobile que chama a função do layout */}
                <button className="mobile-menu-button" onClick={onMenuClick}>
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>
                <h1>{title}</h1>
            </div>

            <div className="header-actions">
                {/* Ícone de Notificação */}
                <div className="notification-icon" onClick={toggleNotificationPanel}>
                    <svg className="header-icon" viewBox="0 0 24 24">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    {/* Badge de Contagem */}
                    <span className={`notification-badge ${unreadCount > 0 ? 'show' : ''}`}>{unreadCount}</span>
                </div>

                {/* Painel Dropdown de Notificações */}
                <div className={`dropdown-notification-menu ${notificationPanelVisible ? 'show' : ''}`}>
                    <div className="notification-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Notificações</h3>
                        {/* --- BOTÃO LIMPAR LIDAS --- */}
                        <button
                            onClick={handleClearRead}
                            disabled={!hasReadNotifications} // Desabilita se não houver lidas
                            style={{
                                background: 'none',
                                border: 'none',
                                color: hasReadNotifications ? 'var(--theme-accent-blue)' : 'var(--gray-500)', // Muda cor se desabilitado
                                cursor: hasReadNotifications ? 'pointer' : 'default',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                padding: '5px'
                            }}
                            title={hasReadNotifications ? "Limpar notificações lidas" : "Nenhuma notificação lida para limpar"}
                        >
                            Limpar Lidas
                        </button>
                         {/* --- FIM BOTÃO --- */}
                    </div>
                    <ul className="notification-list">
                        {notifications && notifications.length > 0 ? (
                            notifications.map(notif => (
                                <li key={notif._id} className={!notif.lida ? 'unread' : ''}>{notif.mensagem}</li>
                            ))
                        ) : (
                            <li className="empty-state">Nenhuma notificação.</li>
                        )}
                    </ul>
                </div>

                {/* Perfil do Utilizador */}
                <div className="user-profile" onClick={() => setUserDropdownVisible(!userDropdownVisible)}>
                    <div className="user-details">
                        <span className="user-name">{user.name}</span>
                        <span className="user-role">{user.role === 'adm' ? 'CEO ADM' : 'Vendedor'}</span>
                    </div>
                    {/* Dropdown do Utilizador */}
                    <div className={`dropdown-user-menu ${userDropdownVisible ? 'show' : ''}`}>
                        <a href="#" onClick={handleLogout}>Sair</a>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;