import { useState, useEffect } from 'react';
import io from 'socket.io-client';
//
const socket = io();

export const useSocket = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Busca o histórico inicial
    const fetchInitialNotifications = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch('/api/notificacoes', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setNotifications(data.notificacoes);
        setUnreadCount(data.naoLidas);
      } catch (error) {
        console.error("Erro ao buscar notificações iniciais:", error);
      }
    };
    fetchInitialNotifications();

    // Ouve por novas notificações
    socket.on('nova_notificacao', (novaNotificacao) => {
      setNotifications(prev => [novaNotificacao, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    // Limpa o listener quando o componente desmontar
    return () => {
      socket.off('nova_notificacao');
    };
  }, []);
  
  const markAsRead = async () => {
     try {
        const token = localStorage.getItem('authToken');
        await fetch('/api/notificacoes/ler', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
     } catch (error) {
        console.error("Erro ao marcar notificações como lidas:", error);
     }
  };

  return { notifications, unreadCount, markAsRead };
};