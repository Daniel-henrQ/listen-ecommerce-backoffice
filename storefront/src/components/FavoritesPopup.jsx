// storefront/src/components/FavoritesPopup.jsx
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import styles from './FavoritesPopup.module.css'; // Criaremos este CSS
//import { FaTimes } from 'react-icons/fa';

// Helper para formatar moeda
const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

const FavoritesPopup = ({ isOpen, onClose }) => {
    // Usando useContext como nos seus outros arquivos
    const { favoritos, removeFavorito, clearFavoritos } = useContext(AuthContext);

    if (!isOpen) return null;

    const handleRemove = (e, produtoId) => {
        e.preventDefault();
        e.stopPropagation();
        removeFavorito(produtoId);
    }

    const handleClear = (e) => {
        e.preventDefault();
        clearFavoritos();
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Favoritos</h2>
                    <button onClick={onClose} className={styles.closeButton}>
                        <FaTimes />
                    </button>
                </div>
                
                <div className={styles.content}>
                    {favoritos.length === 0 ? (
                        <p className={styles.emptyText}>Sua lista de favoritos está vazia.</p>
                    ) : (
                        favoritos.map((produto) => (
                            <div key={produto._id} className={styles.item}>
                                {/* Imagem - Ajuste a URL se necessário */}
                                <img 
                                    src={`http://localhost:3000/uploads/${produto.imagem}`} 
                                    alt={produto.nome} 
                                    className={styles.itemImage} 
                                />
                                <div className={styles.itemDetails}>
                                    <h4>{produto.nome}</h4>
                                    <p>{formatCurrency(produto.preco)}</p>
                                </div>
                                <div className={styles.itemActions}>
                                    <button onClick={(e) => handleRemove(e, produto._id)} className={styles.removeButton}>
                                        Remover
                                    </button>
                                    <Link to={`/produto/${produto._id}`} onClick={onClose} className={styles.viewButton}>
                                        Ver Produto
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {favoritos.length > 0 && (
                    <div className={styles.footer}>
                        <button onClick={handleClear} className={styles.clearButton}>
                            Limpar Lista
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FavoritesPopup;