document.addEventListener("DOMContentLoaded", () => {
    // ROTA ATUALIZADA para o novo padrão da API
    const API_ADMIN_URL = "/api/admin/users";
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    const userListBody = document.getElementById("user-list-body");
    const userSearchBox = document.getElementById("user-search-box");
    const btnShowAddUserPopup = document.getElementById("btn-show-add-user-popup");
    const popupAddUser = document.getElementById("popup-add-user");
    const formAddUser = document.getElementById("form-add-user");
    const addUserMessage = document.getElementById("add-user-message");

    async function carregarUsuarios(filtros = {}) {
        if (!userListBody) return;
        const params = new URLSearchParams(filtros).toString();
        const url = `${API_ADMIN_URL}?${params}`;
        try {
            const res = await fetch(url, { headers: authHeaders });
            if (res.status === 403) {
                 userListBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Acesso negado. Apenas administradores podem ver esta secção.</td></tr>`;
                 return;
            }
            if (!res.ok) throw new Error('Falha ao carregar utilizadores');
            const users = await res.json();
            
            userListBody.innerHTML = "";
             if (!users || users.length === 0) {
                userListBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Nenhum utilizador encontrado.</td></tr>`;
                return;
            }
            users.forEach(user => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.cpf}</td>
                    <td>${user.role}</td>
                    <td class="actions">
                        <button class="delete-btn" data-user-id="${user._id}">Excluir</button>
                    </td>`;
                userListBody.appendChild(tr);
            });
        } catch (error) {
            console.error(error);
            userListBody.innerHTML = `<tr><td colspan="5">Erro ao carregar utilizadores.</td></tr>`;
        }
    }

    document.addEventListener('viewChanged', (e) => {
        if (e.detail.viewId === 'admin') {
            carregarUsuarios();
        }
    });

    if (userSearchBox) {
        userSearchBox.addEventListener("input", (e) => {
            carregarUsuarios({ search: e.target.value.trim() });
        });
    }
    
    if (btnShowAddUserPopup) {
        btnShowAddUserPopup.addEventListener("click", () => {
            if(popupAddUser) popupAddUser.style.display = "flex";
        });
    }

    if (formAddUser) {
        formAddUser.addEventListener("submit", async (e) => {
            e.preventDefault();
            const userData = Object.fromEntries(new FormData(formAddUser).entries());
            addUserMessage.textContent = "";

            try {
                const res = await fetch(API_ADMIN_URL, { method: 'POST', headers: authHeaders, body: JSON.stringify(userData) });
                const data = await res.json();
                if (!res.ok) throw new Error(data.msg || "Erro desconhecido.");

                addUserMessage.style.color = 'green';
                addUserMessage.textContent = data.msg;
                
                await carregarUsuarios();
                setTimeout(() => {
                    popupAddUser.style.display = "none";
                    formAddUser.reset();
                    addUserMessage.textContent = "";
                }, 1500);

            } catch (error) {
                addUserMessage.style.color = '#e74c3c';
                addUserMessage.textContent = error.message;
            }
        });
    }

    if (userListBody) {
        userListBody.addEventListener("click", async (e) => {
            if (e.target.classList.contains("delete-btn")) {
                const userId = e.target.dataset.userId;
                if (confirm("Tem a certeza de que deseja excluir este utilizador?")) {
                    try {
                        await fetch(`${API_ADMIN_URL}/${userId}`, { method: 'DELETE', headers: authHeaders });
                        await carregarUsuarios();
                    } catch (error) {
                        alert("Falha ao excluir utilizador.");
                    }
                }
            }
        });
    }
    
    if (popupAddUser) {
        popupAddUser.addEventListener("click", (e) => {
            if (e.target === popupAddUser) popupAddUser.style.display = "none";
        });
    }
});