document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/';
        return;
    }

    let userPayload = {};
    try {
        userPayload = JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        console.error("Erro ao descodificar o token:", e);
        localStorage.removeItem('authToken');
        window.location.href = '/';
        return;
    }

    // --- DOM REFERENCES ---
    const userNameSpan = document.querySelector(".user-name");
    const userRoleSpan = document.querySelector(".user-role");
    const userProfileMenu = document.getElementById("user-profile-menu");
    const userDropdown = document.getElementById("user-dropdown");
    const logoutButton = document.getElementById("logout-button");

    // --- REFERÊNCIAS PARA A RESPONSIVIDADE ---
    const sidebar = document.querySelector('.sidebar');
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const mobileOverlay = document.querySelector('.mobile-overlay');

    const menuItems = {
        produtos: document.getElementById("menu-produtos"),
        clientes: document.getElementById("menu-clientes"),
        vendas: document.getElementById("menu-vendas"),
        fornecedores: document.getElementById("menu-fornecedores"),
        compras: document.getElementById("menu-compras"),
        admin: document.getElementById("menu-admin")
    };
    const allMenuItems = Object.values(menuItems).filter(Boolean);

    const views = {
        produtos: document.getElementById("view-produtos"),
        admin: document.getElementById("view-admin")
    };
    
    // --- LÓGICA PARA O MENU MOBILE ---
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            mobileOverlay.classList.toggle('show');
        });
    }

    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            mobileOverlay.classList.remove('show');
        });
    }
    // ------------------------------------------

    // --- LOGIC ---
    function inicializarDashboard() {
        userNameSpan.textContent = userPayload.name || "Utilizador";
        userRoleSpan.textContent = userPayload.role === 'adm' ? 'CEO ADM' : 'Vendedor';

        const userRole = userPayload.role;
        const permissions = {
            'adm': ['produtos', 'clientes', 'vendas', 'fornecedores', 'compras', 'admin'],
            'vendas': ['produtos', 'clientes', 'vendas', 'fornecedores', 'compras']
        };

        const userPermissions = permissions[userRole] || [];
        allMenuItems.forEach(item => item.style.display = 'none');
        userPermissions.forEach(permissionKey => {
            if (menuItems[permissionKey]) {
                menuItems[permissionKey].style.display = 'flex';
            }
        });

        const firstVisibleMenu = allMenuItems.find(item => item.style.display === 'flex');
        if (firstVisibleMenu) {
            const initialViewId = firstVisibleMenu.id.replace('menu-', '');
            handleMenuClick(firstVisibleMenu, views[initialViewId]);
            
            document.dispatchEvent(new CustomEvent('viewChanged', { 
                detail: { viewId: initialViewId } 
            }));
        } else {
            document.querySelector('.main-content').innerHTML = "<h1>Sem módulos disponíveis.</h1>";
        }
    }

    function handleMenuClick(activeMenu, activeView) {
        allMenuItems.forEach(item => item.classList.remove('active'));
        Object.values(views).forEach(view => view && (view.style.display = 'none'));

        if (activeMenu) activeMenu.classList.add('active');
        if (activeView) activeView.style.display = 'block';

        document.dispatchEvent(new CustomEvent('viewChanged', { 
            detail: { viewId: activeMenu.id.replace('menu-', '') } 
        }));
        
        // Fecha o menu mobile após clicar num item
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
            mobileOverlay.classList.remove('show');
        }
    }

    // --- EVENT LISTENERS ---
    Object.keys(menuItems).forEach(key => {
        const menuItem = menuItems[key];
        const view = views[key];
        if (menuItem) {
            menuItem.addEventListener("click", () => {
                if(view) {
                    handleMenuClick(menuItem, view);
                }
            });
        }
    });

    logoutButton.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("authToken");
        window.location.href = "/";
    });

    userProfileMenu.addEventListener("click", (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle("show");
    });

    window.addEventListener('click', () => {
        if (userDropdown.classList.contains('show')) {
            userDropdown.classList.remove('show');
        }
    });

    // --- INITIALIZATION ---
    inicializarDashboard();
});