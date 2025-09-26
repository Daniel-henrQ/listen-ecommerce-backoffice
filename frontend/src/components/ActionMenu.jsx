import React, { useState, useEffect, useRef } from 'react';

function ActionMenu({ onEdit, onDelete }) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={menuRef}>
            <button className="action-btn" onClick={() => setIsOpen(!isOpen)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
            </button>
            {isOpen && (
                <ul className="action-menu">
                    {onEdit && <li className="action-menu-item" onClick={() => { onEdit(); setIsOpen(false); }}>Editar</li>}
                    {onDelete && <li className="action-menu-item delete" onClick={() => { onDelete(); setIsOpen(false); }}>Excluir</li>}
                </ul>
            )}
        </div>
    );
}

export default ActionMenu;