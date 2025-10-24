// frontend/src/components/Header.jsx
import React, { useState, useContext } from 'react'; // Adicionar useContext
import { AuthContext } from '../context/AuthContext'; // Importar AuthContext
import { useSocket } from '../hooks/useSocket';

// Recebe onMenuClick, user e title continuam vindo como props do Layout
function Header({ user, title, onMenuClick }) {
    const { logout } = useContext(AuthContext); // Obter função logout do contexto
    const { notifications, unreadCount, markAsRead, clearReadNotifications } = useSocket();
    const [userDropdownVisible, setUserDropdownVisible] = useState(false);
    const [notificationPanelVisible, setNotificationPanelVisible] = useState(false);

    // --- FUNÇÃO DE LOGOUT ATUALIZADA ---
    const handleLogout = () => {
        logout(); // Chama a função logout do contexto
        // O redirecionamento será tratado pelo PrivateRoute ou pelo interceptor da API
        // window.location.href = '/'; // Não precisa mais redirecionar aqui
    };
    // --- FIM DA ATUALIZAÇÃO ---

    // Restante do componente (toggleNotificationPanel, handleClearRead, return...)
    // permanece igual, mas agora recebe o 'user' do AuthContext via props.

    const toggleNotificationPanel = () => {
        // ... (lógica existente) ...
         const isVisible = !notificationPanelVisible;
         setNotificationPanelVisible(isVisible);
         if (isVisible && unreadCount > 0) {
             markAsRead();
         }
    };

    const handleClearRead = (e) => {
        // ... (lógica existente) ...
         e.stopPropagation();
         clearReadNotifications();
    };

    const hasReadNotifications = notifications && notifications.some(n => n.lida);

    // Se o user ainda não carregou (vindo do contexto), pode mostrar um placeholder
    if (!user || user.isLoading) {
         return <header className="header-fixed"><div>A carregar header...</div></header>;
    }


    return (
        <header className="header-fixed">
            <div className="header-content-wrapper">
                <button className="mobile-menu-button" onClick={onMenuClick}>
                    {/* ... (svg icon) ... */}
                     <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </button>
                <h1>{title}</h1>
            </div>

            <div className="header-actions">
                {/* Ícone de Notificação */}
                <div className="notification-icon" onClick={toggleNotificationPanel}>
                     {/* ... (svg icon) ... */}
                     <svg className="header-icon" viewBox="0 0 24 24"> <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path> <path d="M13.73 21a2 2 0 0 1-3.46 0"></path> </svg>
                    <span className={`notification-badge ${unreadCount > 0 ? 'show' : ''}`}>{unreadCount}</span>
                </div>

                {/* Painel Dropdown de Notificações */}
                <div className={`dropdown-notification-menu ${notificationPanelVisible ? 'show' : ''}`}>
                     {/* ... (lógica existente) ... */}
                      <div className="notification-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <h3>Notificações</h3>
                         <button
                             onClick={handleClearRead}
                             disabled={!hasReadNotifications}
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
                        {/* Usa o 'name' e 'role' do user vindo do contexto via props */}
                        <span className="user-name">{user.name}</span>
                        <span className="user-role">{user.role === 'adm' ? 'CEO ADM' : 'Vendedor'}</span>
                    </div>
                    {/* Dropdown do Utilizador */}
                    <div className={`dropdown-user-menu ${userDropdownVisible ? 'show' : ''}`}>
                        {/* Chama handleLogout que agora usa o contexto */}
                        <a href="#" onClick={handleLogout}>Sair</a>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;

