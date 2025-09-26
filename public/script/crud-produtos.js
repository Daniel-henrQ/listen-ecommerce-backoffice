document.addEventListener("DOMContentLoaded", () => {
    const API_PRODUTOS_URL = "/api/produtos";
    const token = localStorage.getItem('authToken');

    if (!token) {
        console.error("Token de autenticação não encontrado. A aplicação não funcionará.");
        window.location.href = '/';
        return;
    }

    // Cabeçalhos para diferentes tipos de requisição
    const authHeaders = { 'Authorization': `Bearer ${token}` };
    const authHeadersForJson = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    // --- Referências do DOM ---
    const productTableBody = document.getElementById("product-table-body");
    const selectAllCheckbox = document.getElementById("select-all-checkbox");
    const actionsSelecaoDiv = document.getElementById("actions-selecao");
    const btnExcluirSelecionados = document.getElementById("btn-excluir-selecionados");
    const campoPesquisa = document.getElementById("campo-pesquisa");
    const filterTabsContainer = document.querySelector(".filter-tabs");

    // Popup de Adicionar
    const btnAbrirFormAdicionar = document.getElementById("btn-abrir-form-adicionar");
    const popupAdicionar = document.getElementById("popup-adicionar-produto");
    const formAdicionar = document.getElementById("form-adicionar-produto");
    const addProductMessage = document.getElementById("add-product-message");

    // Popup de Editar
    const popupEdit = document.getElementById("popup-edit-product");
    const formEdit = document.getElementById("form-edit-product");
    const editProductId = document.getElementById("edit-product-id");

    // Referências para o popup de visualização de imagem
    const popupVisualizarImagem = document.getElementById("popup-visualizar-imagem");
    const imagemAmpliada = document.getElementById("imagem-ampliada");
    const btnFecharPopupImagem = document.querySelector(".close-image-popup");

    let activeActionMenu = null;
    let activeButton = null;

    // --- Funções de Lógica Principal ---

    async function carregarProdutos(filtros = {}) {
        const params = new URLSearchParams(filtros).toString();
        const url = `${API_PRODUTOS_URL}?${params}`;
        try {
            const res = await fetch(url, { headers: authHeaders });
            if (res.status === 401) { // Token inválido ou expirado
                localStorage.removeItem('authToken');
                window.location.href = '/';
                return;
            }
            if (!res.ok) {
                throw new Error(`Falha ao buscar produtos: ${res.statusText}`);
            }
            const produtos = await res.json();
            renderTabela(produtos);
        } catch (error) {
            console.error(error);
            productTableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;">Erro ao carregar produtos. Verifique a consola.</td></tr>`;
        }
    }

    function renderTabela(produtos) {
        productTableBody.innerHTML = "";
        if (!produtos || produtos.length === 0) {
            productTableBody.innerHTML = `<tr><td colspan="9" style="text-align: center;">Nenhum produto encontrado.</td></tr>`;
            return;
        }
        produtos.forEach(produto => {
            const tr = document.createElement("tr");
            tr.dataset.produtoId = produto._id;
            const imagemSrc = `/uploads/${produto.imagem}`;
            tr.innerHTML = `
                <td><input type="checkbox" class="produto-checkbox" data-id="${produto._id}"></td>
                <td><img src="${imagemSrc}" alt="Capa do Álbum" class="product-cover"> <span>${produto.nome}</span></td>
                <td>${produto.artista}</td>
                <td>${produto.fornecedor}</td>
                <td>${produto.categoria}</td>
                <td>${produto.quantidade}</td>
                <td>R$ ${produto.preco ? produto.preco.toFixed(2) : '0.00'}</td>
                <td>${new Date(produto.createdAt).toLocaleDateString('pt-BR')}</td>
                <td class="actions"><button class="action-button action-menu-btn" data-id="${produto._id}">...</button></td>`;
            productTableBody.appendChild(tr);
        });
    }

    // --- Funções de Formulário ---

    if (formAdicionar) {
        formAdicionar.addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData(formAdicionar);
            addProductMessage.textContent = '';
            try {
                const res = await fetch(API_PRODUTOS_URL, { method: 'POST', headers: authHeaders, body: formData });
                const data = await res.json();
                if (!res.ok) { throw new Error(data.msg || 'Erro no servidor ao adicionar.'); }
                popupAdicionar.style.display = 'none';
                await carregarProdutos();
            } catch (error) {
                addProductMessage.style.color = 'red';
                addProductMessage.textContent = error.message;
            }
        });
    }

    if (formEdit) {
        formEdit.addEventListener("submit", async (e) => {
            e.preventDefault();
            const id = editProductId.value;
            const formData = new FormData(formEdit);
            try {
                const res = await fetch(`${API_PRODUTOS_URL}/${id}`, { method: 'PUT', headers: authHeaders, body: formData });
                const data = await res.json();
                if (!res.ok) { throw new Error(data.msg || 'Erro no servidor ao atualizar.'); }
                popupEdit.style.display = 'none';
                await carregarProdutos();
            } catch (error) {
                document.getElementById('edit-product-message').textContent = error.message;
            }
        });
    }

    // --- Funções de UI (Popups e Menus) ---

    function toggleActionMenu(button) {
        const id = button.dataset.id;
        closeActiveActionMenu();
        const menu = document.createElement('ul');
        menu.className = 'action-menu';
        menu.innerHTML = `<li class="edit-btn" data-id="${id}">Editar</li><li class="delete-btn delete" data-id="${id}">Excluir</li>`;
        button.parentElement.appendChild(menu);
        button.style.display = 'none';
        setTimeout(() => menu.classList.add('show'), 10);
        activeActionMenu = menu;
        activeButton = button;
    }

    function closeActiveActionMenu() {
        if (activeActionMenu) {
            activeActionMenu.remove();
            activeActionMenu = null;
        }
        if (activeButton) {
            activeButton.style.display = '';
            activeButton = null;
        }
    }

    async function openEditPopup(id) {
        try {
            const res = await fetch(`${API_PRODUTOS_URL}/${id}`, { headers: authHeaders });
            if (!res.ok) throw new Error('Produto não encontrado');
            const produto = await res.json();
            formEdit.reset();
            document.getElementById('edit-product-message').textContent = '';
            editProductId.value = produto._id;
            document.getElementById('edit-product-name').value = produto.nome;
            document.getElementById('edit-product-artist').value = produto.artista;
            document.getElementById('edit-product-fornecedor').value = produto.fornecedor;
            document.getElementById('edit-product-category').value = produto.categoria;
            document.getElementById('edit-product-quantity').value = produto.quantidade;
            document.getElementById('edit-product-price').value = produto.preco;
            popupEdit.style.display = 'flex';
        } catch (error) {
            console.error("Erro ao abrir popup de edição:", error);
            alert("Não foi possível carregar os dados do produto.");
        }
    }

    // --- Event Listeners (Ouvintes de Eventos) ---

    document.addEventListener('viewChanged', (e) => {
        if (e.detail.viewId === 'produtos') {
            carregarProdutos();
        }
    });

    productTableBody.addEventListener('click', async (e) => {
        const target = e.target;

        if (target.classList.contains('product-cover')) {
            imagemAmpliada.src = target.src;
            popupVisualizarImagem.style.display = 'flex';
        } else if (target.classList.contains('action-menu-btn')) {
            toggleActionMenu(target);
        } else if (target.classList.contains('edit-btn')) {
            openEditPopup(target.dataset.id);
            closeActiveActionMenu();
        } else if (target.classList.contains('delete-btn')) {
            if (confirm("Tem a certeza de que deseja apagar este produto?")) {
                try {
                    await fetch(`${API_PRODUTOS_URL}/${target.dataset.id}`, { method: 'DELETE', headers: authHeaders });
                    carregarProdutos();
                } catch (error) { alert("Falha ao apagar produto."); }
            }
            closeActiveActionMenu();
        } else if (target.classList.contains('produto-checkbox')) {
            const anyChecked = document.querySelectorAll('.produto-checkbox:checked').length > 0;
            actionsSelecaoDiv.style.display = anyChecked ? "flex" : "none";
        }
    });

    if (btnExcluirSelecionados) {
        btnExcluirSelecionados.addEventListener('click', async () => {
            const selectedIds = Array.from(document.querySelectorAll('.produto-checkbox:checked')).map(cb => cb.dataset.id);
            if (selectedIds.length > 0 && confirm(`Deseja realmente excluir os ${selectedIds.length} produtos selecionados?`)) {
                try {
                    await fetch(`${API_PRODUTOS_URL}/varios`, { method: 'DELETE', headers: authHeadersForJson, body: JSON.stringify({ ids: selectedIds }) });
                    carregarProdutos();
                    actionsSelecaoDiv.style.display = "none";
                    selectAllCheckbox.checked = false;
                } catch (error) { console.error("Erro ao excluir produtos:", error); }
            }
        });
    }

    if (campoPesquisa) campoPesquisa.addEventListener("input", (e) => carregarProdutos({ nome: e.target.value.trim() }));

    if (filterTabsContainer) {
        filterTabsContainer.addEventListener("click", (e) => {
            e.preventDefault();
            if (e.target.classList.contains("filter-tab")) {
                filterTabsContainer.querySelector(".active").classList.remove('active');
                e.target.classList.add('active');
                const categoria = e.target.dataset.categoria;
                carregarProdutos(categoria !== 'all' ? { categoria } : {});
            }
        });
    }

    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', (e) => {
            document.querySelectorAll('.produto-checkbox').forEach(cb => cb.checked = e.target.checked);
            actionsSelecaoDiv.style.display = e.target.checked ? "flex" : "none";
        });
    }

    if (btnAbrirFormAdicionar) {
        btnAbrirFormAdicionar.addEventListener("click", () => {
            formAdicionar.reset();
            addProductMessage.textContent = '';
            popupAdicionar.style.display = "flex";
        });
    }

    if (popupAdicionar) popupAdicionar.addEventListener("click", (e) => { if (e.target === popupAdicionar) popupAdicionar.style.display = "none"; });
    if (popupEdit) popupEdit.addEventListener("click", (e) => { if (e.target === popupEdit) popupEdit.style.display = "none"; });

    if (popupVisualizarImagem) {
        popupVisualizarImagem.addEventListener("click", (e) => {
            if (e.target === popupVisualizarImagem) {
                popupVisualizarImagem.style.display = "none";
            }
        });
    }
    if (btnFecharPopupImagem) {
        btnFecharPopupImagem.addEventListener("click", () => {
            popupVisualizarImagem.style.display = "none";
        });
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.actions')) {
            closeActiveActionMenu();
        }
    });
});