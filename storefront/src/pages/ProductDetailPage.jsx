import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api'; // Serviço de API
import LiquidGlassSidebar from '../components/LiquidGlassSidebar'; // Menu lateral
// Importação do CSS corrigida
import styles from '../assets/css/ProductDetailPage.module.css'; 
import couroBg from '../assets/images/couro.png'; // Imagem de fundo de couro

const ProductDetailPage = () => { // Nome do componente corrigido
    const [produto, setProduto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { id } = useParams(); // Pega o ID do produto da URL

    useEffect(() => {
        const fetchProduto = async () => {
            try {
                setLoading(true);
                // Busca o produto específico na API (ex: /api/produtos/:id)
                const response = await api.get(`/produtos/${id}`);
                setProduto(response.data);
                setError(null);
            } catch (err) {
                setError('Não foi possível carregar o produto.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchProduto();
    }, [id]);

    if (loading) {
        return <div className={styles.pageContainer}>Carregando...</div>;
    }

    if (error) {
        return <div className={styles.pageContainer}>{error}</div>;
    }

    if (!produto) {
        return <div className={styles.pageContainer}>Produto não encontrado.</div>;
    }

    // Define o URL base para as imagens
    const imageUrl = `http://localhost:3000/uploads/${produto.imagem}`;

    return (
        <div className={styles.pageContainer}>
            <LiquidGlassSidebar />
            <main className={styles.contentArea}>
                <div 
                    className={styles.productDetailContainer}
                    style={{ backgroundImage: `url(${couroBg})` }}
                >
                    {/* Coluna da Imagem */}
                    <div className={styles.imageColumn}>
                        <img src={imageUrl} alt={produto.nome} className={styles.productImage} />
                    </div>

                    {/* Coluna das Informações */}
                    <div className={styles.infoColumn}>
                        <h1 className={styles.albumTitle}>{produto.nome}</h1>
                        <h2 className={styles.artistName}>{produto.artista}</h2>
                        
                        <div className={styles.genre}>
                            Gênero: {produto.genero}
                        </div>
                        
                        <div className={styles.price}>
                            R$ {produto.preco.toFixed(2).replace('.', ',')}
                        </div>
                        
                        <div className={styles.description}>
                            <h3>Descrição</h3>
                            <p>{produto.descricao}</p>
                        </div>
                        
                        <div className={styles.actionButtons}>
                            <button className={styles.cartButton}>Adicionar ao Carrinho</button>
                            <button className={styles.buyButton}>Comprar</button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProductDetailPage; // Nome do componente corrigido