// storefront/src/pages/ProductDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import styles from '../assets/css/ProductDetailPage.module.css'; // Importa o CSS Module

const ProductDetailPage = () => {
  const [product, setProduct] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Busca o produto na API
        const response = await api.get(`/produtos/${id}`);
        setProduct(response.data);
      } catch (error) {
        console.error('Erro ao buscar detalhes do produto:', error);
      }
    };

    fetchProduct();
  }, [id]);

  if (!product) {
    // Adiciona um feedback de carregamento mais centralizado
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '5rem', fontSize: '1.5rem' }}>Carregando...</div>;
  }

  // Constrói a URL da imagem. O backend (localhost:3001) serve a pasta /uploads
  const imageUrl = `http://localhost:3001/uploads/${product.imagem}`;

  return (
    <div className={styles.productDetailPage}>
      {/* Coluna da Imagem */}
      <div className={styles.productImage}>
        <img src={imageUrl} alt={product.nome} />
      </div>

      {/* Coluna de Informações */}
      <div className={styles.productInfo}>
        <h1 className={styles.productTitle}>{product.nome}</h1>
        
        <p className={styles.productStock}>
          {product.quantidade > 0 ? 'Disponível' : 'Indisponível'}
        </p>
        
        <p className={styles.productPrice}>
          {/* Formata o preço para o formato R$ XX,XX */}
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(product.preco)}
        </p>

        {/* Container para os botões */}
        <div className={styles.buttonContainer}>
          <button className={styles.buyButton}>COMPRAR</button>
          <button className={styles.addToCartButton}>ADICIONAR AO CARRINHO</button>
        </div>

        {/* Seção de Descrição */}
        <div className={styles.productDescription}>
          <h2>Descrição</h2>
          <p>{product.descricao}</p>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;