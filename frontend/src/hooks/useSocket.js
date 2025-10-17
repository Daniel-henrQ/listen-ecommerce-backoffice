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

  useEffect(() => {
    // --- Conexão e Desconexão ---
    // Ouvintes de conexão/desconexão/erro são úteis para depuração
    const handleConnect = () => console.log('Socket conectado:', socket.id);
    const handleDisconnect = (reason) => console.log('Socket desconectado:', reason);
    const handleConnectError = (err) => console.error('Socket erro de conexão:', err.message, err.data); // Loga mais detalhes se disponíveis

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);


    // --- Busca Histórico Inicial ---
    const fetchInitialNotifications = async () => {
       // Only fetch if token exists and socket is potentially connected
       if (!token) {
           console.warn("useSocket: Sem token, não buscando histórico.");
           return;
       }
       if (!socket.connected) {
           console.warn("useSocket: Socket não conectado, aguardando conexão para buscar histórico.");
           // Poderia tentar buscar após um 'connect' event, mas buscar uma vez é mais simples
       }

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
    fetchInitialNotifications(); // Chama imediatamente


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
    // Limpa TODOS os listeners quando o componente que usa o hook desmontar
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
     // Só executa se houver não lidas e tiver token
     if (unreadCount === 0 || !token) return;

     try {
        const res = await fetch('/api/notificacoes/ler', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
         if (!res.ok) {
             // Tratar erro 401 aqui também, se necessário
             throw new Error(`HTTP error! status: ${res.status}`);
         }
        setUnreadCount(0); // Zera o contador localmente
        // Marca todas as notificações locais como lidas para refletir na UI imediatamente
        setNotifications(prev => (prev || []).map(n => ({ ...n, lida: true })));
        console.log("Notificações marcadas como lidas.");
     } catch (error) {
        console.error("Erro ao marcar notificações como lidas:", error);
     }
  };

  // Retorna o estado e a função para o componente
  return { notifications, unreadCount, markAsRead };
};