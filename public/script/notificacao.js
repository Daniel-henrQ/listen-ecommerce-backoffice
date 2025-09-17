document.addEventListener("DOMContentLoaded", () => {
    const API_NOTIFICACAO_URL = "/api/notificacoes";
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    const notificationBell = document.getElementById("notification-bell");
    const notificationCount = document.getElementById("notification-count");
    const notificationPanel = document.getElementById("notification-panel");
    const notificationListItems = document.getElementById("notification-list-items");

    // 1. Conectar ao servidor Socket.IO
    const socket = io();

    // Função para adicionar uma notificação à lista na interface
    function adicionarNotificacaoNaLista(notificacao, noInicio = false) {
        // Remove a mensagem "Nenhuma notificação" se ela existir
        const emptyState = notificationListItems.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        const li = document.createElement("li");
        li.textContent = notificacao.mensagem;
        if (!notificacao.lida) {
            li.classList.add("unread");
        }

        if (noInicio) {
            notificationListItems.prepend(li); // Adiciona no topo
        } else {
            notificationListItems.appendChild(li); // Adiciona no fim
        }
    }

    // Função para atualizar o contador de notificações não lidas
    function atualizarContador(totalNaoLidas) {
        if (totalNaoLidas > 0) {
            notificationCount.textContent = totalNaoLidas;
            notificationCount.style.display = 'flex';
        } else {
            notificationCount.style.display = 'none';
        }
    }

    // Função que busca o histórico de notificações via API (usada ao carregar a página)
    async function carregarHistoricoNotificacoes() {
        try {
            const res = await fetch(API_NOTIFICACAO_URL, { headers: authHeaders });
            if (!res.ok) return;

            const { notificacoes, naoLidas } = await res.json();
            
            atualizarContador(naoLidas);

            notificationListItems.innerHTML = "";
            if (notificacoes.length === 0) {
                notificationListItems.innerHTML = `<li class="empty-state">Nenhuma notificação encontrada.</li>`;
            } else {
                notificacoes.forEach(not => adicionarNotificacaoNaLista(not));
            }
        } catch (error) {
            console.error("Erro ao carregar histórico de notificações:", error);
        }
    }

    // 2. Ouvir o evento 'nova_notificacao' do servidor
    socket.on('nova_notificacao', (notificacao) => {
        console.log("Nova notificação recebida via WebSocket:", notificacao);
        
        // Adiciona a nova notificação no topo da lista
        adicionarNotificacaoNaLista(notificacao, true);

        // Incrementa o contador
        const totalAtual = parseInt(notificationCount.textContent, 10) || 0;
        atualizarContador(totalAtual + 1);
    });
    
    // Função para marcar notificações como lidas (continua igual)
    async function marcarComoLidas() {
        try {
            await fetch(`${API_NOTIFICACAO_URL}/ler`, { method: 'POST', headers: authHeaders });
            notificationCount.style.display = 'none';
            notificationListItems.querySelectorAll('.unread').forEach(item => item.classList.remove('unread'));
        } catch (error) {
            console.error("Erro ao marcar notificações como lidas:", error);
        }
    }
    
    if (notificationBell) {
        notificationBell.addEventListener("click", (e) => {
            e.stopPropagation();
            const isVisible = notificationPanel.classList.contains("show");
            
            if (!isVisible) {
                notificationPanel.classList.add("show");
                if (parseInt(notificationCount.textContent, 10) > 0) {
                    marcarComoLidas();
                }
            } else {
                notificationPanel.classList.remove("show");
            }
        });
    }

    window.addEventListener('click', (e) => {
        if (!notificationPanel.contains(e.target) && !notificationBell.contains(e.target)) {
            notificationPanel.classList.remove("show");
        }
    });

    // 3. Carrega o histórico apenas uma vez ao iniciar a página
    carregarHistoricoNotificacoes();
});