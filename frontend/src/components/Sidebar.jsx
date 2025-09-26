import React from 'react';
import { NavLink } from 'react-router-dom';
import logo from '../assets/images/listen.svg';
//
const menuItems = [
    { id: 'produtos', label: 'Produtos', icon: <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> },
    { id: 'clientes', label: 'Clientes', icon: <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> },
    { id: 'vendas', label: 'Vendas', icon: <svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg> },
    { id: 'fornecedor', label: 'Fornecedor', icon: <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg> },
    { id: 'compras', label: 'Compras', icon: <svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg> },
    { id: 'admin', label: 'Administrador', icon: <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> },
];

const menuPermissions = {
    'adm': ['produtos', 'clientes', 'vendas', 'fornecedor', 'compras', 'admin'],
    'vendas': ['produtos', 'clientes', 'vendas', 'fornecedor', 'compras']
};

function Sidebar({ userRole }) {
    const userPermissions = menuPermissions[userRole] || [];

    return (
        <aside className="sidebar">
            <div className="sidebar-header"><img src="/images/listen.svg" alt="Logo Listen" /></div>
            <nav className="sidebar-menu">
                {menuItems.filter(item => userPermissions.includes(item.id)).map(item => (
                    <NavLink to={`/app/${item.id}`} key={item.id} className={({ isActive }) => isActive ? "active" : ""}>
                        {React.cloneElement(item.icon, { fill: "none", stroke: "currentColor", strokeWidth: "2" })}
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}

export default Sidebar;