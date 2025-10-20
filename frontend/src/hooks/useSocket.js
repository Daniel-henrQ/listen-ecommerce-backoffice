import { useState, useEffect, useCallback } from 'react'; // Adicionado useCallback
import io from 'socket.io-client';

// Get token ONCE when the hook is initialized
const token = localStorage.getItem('authToken');

// Pass token in auth object during connection
const socket = io({
  auth: {
    token: token // Send token here
  }
});


export const useSocket = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // --- Função para buscar histórico --- (Separada para reutilização)
  const fetchInitialNotifications = useCallback(async () => { // Usar useCallback
     if (!token) {
         console.warn("useSocket: Sem token, não buscando histórico.");
         return;
     }

    try {
      const res = await fetch('/api/notificacoes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
       if (!res.ok) {
           if (res.status === 401) {
               console.error("useSocket: Token inválido/expirado ao buscar histórico.");
               localStorage.removeItem('authToken'); // Optional: logout user or redirect
           }
           throw new Error(`HTTP error! status: ${res.status}`);
       }
      const data = await res.json();
       console.log("Histórico de notificações carregado:", data);
      setNotifications(data.notificacoes || []);
      setUnreadCount(data.naoLidas || 0);
    } catch (error) {
      console.error("Erro ao buscar notificações iniciais:", error);
       // Limpar estado em caso de erro pode ser uma opção
       setNotifications([]);
       setUnreadCount(0);
    }
  }, []); // Dependência vazia, pois 'token' é constante no escopo do hook

  useEffect(() => {
    // --- Conexão e Desconexão ---
    const handleConnect = () => {
        console.log('Socket conectado:', socket.id);
        fetchInitialNotifications(); // Busca histórico ao conectar
    };
    const handleDisconnect = (reason) => console.log('Socket desconectado:', reason);
    const handleConnectError = (err) => console.error('Socket erro de conexão:', err.message, err.data);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    // --- Ouvir Novas Notificações ---
    const handleNewNotification = (novaNotificacao) => {
      console.log('Nova notificação recebida via WebSocket:', novaNotificacao);
      setNotifications(prev => [novaNotificacao, ...(prev || [])]);
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
    };
  // A dependência fetchInitialNotifications garante que o listener seja atualizado se a função mudar (embora não deva mudar com useCallback)
  }, [fetchInitialNotifications]);


  // --- Função para Marcar como Lidas ---
  const markAsRead = async () => {
     if (unreadCount === 0 || !token) return;
     try {
        const res = await fetch('/api/notificacoes/ler', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
         if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        setUnreadCount(0);
        // Atualiza o estado local para refletir que foram lidas
        setNotifications(prev => (prev || []).map(n => ({ ...n, lida: true })));
        console.log("Notificações marcadas como lidas.");
     } catch (error) {
        console.error("Erro ao marcar notificações como lidas:", error);
     }
  };

  // --- NOVA FUNÇÃO ---
  // Função para Limpar Notificações Lidas
  const clearReadNotifications = async () => {
      if (!token) return; // Precisa de token para autenticar a exclusão

      // Opcional: Confirmar com o utilizador
      // if (!window.confirm("Tem a certeza que deseja limpar as notificações lidas?")) {
      //     return;
      // }

      try {
          const res = await fetch('/api/notificacoes/read', { // Chama a nova rota DELETE
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });

          if (!res.ok) {
              const errorData = await res.json(); // Tenta pegar a mensagem de erro do backend
              throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
          }

          // Atualiza o estado local removendo as notificações lidas
          setNotifications(prev => (prev || []).filter(n => !n.lida));
          // O contador de não lidas (unreadCount) não deve mudar aqui, pois só excluímos as lidas.

          console.log("Notificações lidas foram excluídas.");
          // Poderia adicionar uma notificação de sucesso para o utilizador aqui, se desejado

      } catch (error) {
          console.error("Erro ao limpar notificações lidas:", error);
          // Poderia mostrar uma mensagem de erro para o utilizador
      }
  };
  // --- FIM NOVA FUNÇÃO ---

  // Retorna a nova função junto com as outras
  return { notifications, unreadCount, markAsRead, clearReadNotifications };
};