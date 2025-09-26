import React from 'react';

function Modal({ isVisible, onClose, children, title }) {
  if (!isVisible) {
    return null;
  }

  // Função para fechar o modal se o clique for no overlay
  const handleOverlayClick = (e) => {
    if (e.target.id === 'modal-overlay') {
      onClose();
    }
  };

  return (
    <div className="popup-overlay" id="modal-overlay" style={{ display: 'flex' }} onClick={handleOverlayClick}>
      <div className="popup">
        {title && <h3>{title}</h3>}
        {children}
      </div>
    </div>
  );
}

export default Modal;