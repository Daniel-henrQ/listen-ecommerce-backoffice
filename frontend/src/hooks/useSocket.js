import { useState, useEffect } from 'react';
import io from 'socket.io-client';

// Get token ONCE when the hook is initialized
const token = localStorage.getItem('authToken');

// Pass token in auth object during connection
// Certifique-se de que o servidor está configurado para receber isso (como fizemos no backend)
const socket = io({
  auth: {
    token: token // Send token here
  }
});


export const useSocket = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // --- Função para buscar histórico --- (Separada para reutilização)
  const fetchInitialNotifications = async () => {
     // Only fetch if token exists and socket is potentially connected
     if (!token) {
         console.warn("useSocket: Sem token, não buscando histórico.");
         return;
     }
     // Não checa mais socket.connected aqui, pois será chamado no connect

    try {
      const res = await fetch('/api/notificacoes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
       if (!res.ok) {
           // Handle potential 401 Unauthorized if token is invalid/expired
           if (res.status === 401) {
               console.error("useSocket: Token inválido/expirado ao buscar histórico.");
               localStorage.removeItem('authToken'); // Optional: logout user or redirect
           }
           throw new Error(`HTTP error! status: ${res.status}`);
       }
      const data = await res.json();
       console.log("Histórico de notificações carregado:", data);
      setNotifications(data.notificacoes || []); // Garante que é um array
      setUnreadCount(data.naoLidas || 0);        // Garante que é um número
    } catch (error) {
      console.error("Erro ao buscar notificações iniciais:", error);
    }
  };

  useEffect(() => {
    // --- Conexão e Desconexão ---
    const handleConnect = () => {
        console.log('Socket conectado:', socket.id);
        // Tenta buscar o histórico ao conectar (ou reconectar)
        fetchInitialNotifications();
    };
    const handleDisconnect = (reason) => console.log('Socket desconectado:', reason);
    const handleConnectError = (err) => console.error('Socket erro de conexão:', err.message, err.data); // Loga mais detalhes se disponíveis

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    // --- Busca Histórico Inicial (Mantida para o primeiro load) ---
    // Chama imediatamente na montagem do hook, caso a conexão já esteja ativa ou ocorra muito rápido
    fetchInitialNotifications();


    // --- Ouvir Novas Notificações ---
    const handleNewNotification = (novaNotificacao) => {
      console.log('Nova notificação recebida via WebSocket:', novaNotificacao);
      // Adiciona no início da lista
      setNotifications(prev => [novaNotificacao, ...(prev || [])]);
      // Incrementa o contador apenas se a notificação não estiver lida
       if (!novaNotificacao.lida) {
          setUnreadCount(prev => (prev || 0) + 1);
       }
    };
    socket.on('nova_notificacao', handleNewNotification);


    // --- Limpeza ---
    return () => {
      console.log("Limpando listeners do socket...");
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('nova_notificacao', handleNewNotification);
      // Não desconecte o socket aqui, pois outros componentes podem estar usando
    };
  }, []); // Array de dependências vazio para rodar setup/cleanup apenas uma vez


  // --- Função para Marcar como Lidas ---
  const markAsRead = async () => {
     if (unreadCount === 0 || !token) return;

     try {
        const res = await fetch('/api/notificacoes/ler', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
         if (!res.ok) {
             throw new Error(`HTTP error! status: ${res.status}`);
         }
        setUnreadCount(0);
        setNotifications(prev => (prev || []).map(n => ({ ...n, lida: true })));
        console.log("Notificações marcadas como lidas.");
     } catch (error) {
        console.error("Erro ao marcar notificações como lidas:", error);
     }
  };

  return { notifications, unreadCount, markAsRead };
};