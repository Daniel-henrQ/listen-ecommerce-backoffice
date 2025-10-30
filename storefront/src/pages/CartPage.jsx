import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import HomeNav from '../components/HomeNav';
import HomeFooter from '../components/HomeFooter';
import styles from '../assets/css/CartPage.module.css'; 
import { useCart } from '../context/CartContext'; // Importa o contexto

const CartPage = () => {
  // --- Os dados agora vêm do contexto global ---
  const { cartItems, removeFromCart, updateQuantity } = useCart();
  
  // O estado local é usado apenas para a seleção de frete
  const [shippingOption, setShippingOption] = useState('gratis');

  // Verifica se o carrinho está vazio
  const isEmpty = cartItems.length === 0;

  // --- Cálculos Dinâmicos ---
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  // Lógica de frete (baseada na seleção)
  const shippingCost = shippingOption === 'gratis' ? 0.00 : 13.66;
  
  const total = subtotal + shippingCost;
  
  // Funções que chamam o contexto para atualizar o estado global
  const handleQuantityChange = (id, amount) => {
    const item = cartItems.find(item => item.id === id);
    if (item) {
      // Atualiza a quantidade, garantindo que não seja menor que 1
      const newQuantity = Math.max(1, item.quantity + amount);
      updateQuantity(id, newQuantity);
    }
  };

  const handleRemoveItem = (id) => {
    removeFromCart(id);
  };

  return (
    <div className={styles.cartPage}>
      <HomeNav />
      
      <main className={styles.container}>
        <div className={styles.breadcrumb}>Carrinho</div>

        <div className={styles.cartLayout}>
          
          {/* Coluna da Esquerda */}
          <div className={styles.leftColumn}>
            
            {/* Título "CARRINHO" (só aparece se não estiver vazio) */}
            {!isEmpty && <h1 className={styles.mainTitle}>CARRINHO</h1>}

            {/* Tabela de Produtos */}
            <table className={styles.cartTable}>
              <thead>
                <tr>
                  <th className={styles.productHeader}>Produto</th>
                  {/* Esconde colunas no layout de carrinho vazio, como na imagem */}
                  {isEmpty ? (
                    <>
                      <th>Quantidade</th>
                      <th>Preço</th>
                    </>
                  ) : (
                    <>
                      <th>Preço</th>
                      <th>Quantidade</th>
                      <th>Subtotal</th>
                      <th></th> {/* Coluna vazia para o ícone de remover */}
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {isEmpty ? (
                  // --- ESTADO DE CARRINHO VAZIO ---
                  <tr>
                    <td colSpan="3" className={styles.emptyCartMessage}>
                      Nenhum produto adicionado
                    </td>
                  </tr>
                ) : (
                  // --- ESTADO DE CARRINHO CHEIO ---
                  cartItems.map(item => (
                    <tr key={item.id} className={styles.cartItem}>
                      {/* Coluna Produto */}
                      <td className={styles.productDetails}>
                        <img src={item.image} alt={item.name} className={styles.productImage} />
                        <div className={styles.productInfo}>
                          <span className={styles.productName}>{item.name}</span>
                          <span className={styles.productArtist}>{item.artist}</span>
                        </div>
                      </td>
                      
                      {/* Coluna Preço */}
                      <td className={styles.itemPrice}>
                        R$ {item.price.toFixed(2)}
                      </td>
                      
                      {/* Coluna Quantidade */}
                      <td className={styles.itemQuantity}>
                        <div className={styles.quantitySelector}>
                          <button onClick={() => handleQuantityChange(item.id, -1)}>-</button>
                          <input type="text" value={item.quantity} readOnly />
                          <button onClick={() => handleQuantityChange(item.id, 1)}>+</button>
                        </div>
                      </td>
                      
                      {/* Coluna Subtotal */}
                      <td className={styles.itemSubtotal}>
                        R$ {(item.price * item.quantity).toFixed(2)}
                      </td>

                      {/* Coluna Remover */}
                      <td className={styles.itemRemove}>
                        <button onClick={() => handleRemoveItem(item.id)} className={styles.removeButton}>
                          <span className="material-symbols-outlined">
                            delete
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Seção de Entrega (Aparece em ambos os casos) */}
            <div className={styles.shippingSection}>
              <h2 className={styles.sectionTitle}>Entrega</h2>
              <div className={styles.cepCalculator}>
                <div className={styles.inputGroup}>
                  <label htmlFor="cep">CEP</label>
                  <input type="text" id="cep" defaultValue="13187-543" />
                </div>
                <button type="button" className={styles.calculateButton}>
                  Calcular
                </button>
              </div>
              <a href="#" className={styles.correiosLink}>
                Ir para o site dos Correios
              </a>
              
              <p className={styles.shippingInfo}>
                {/* Texto dinâmico */}
                Receber {isEmpty ? 0 : cartItems.reduce((acc, item) => acc + item.quantity, 0)} {cartItems.length > 1 ? 'itens' : 'item'} em 13187-543
              </p>

              {/* Opções de Frete */}
              <div className={styles.shippingOptions}>
                <div className={`${styles.option} ${shippingOption === 'pago' ? styles.selected : ''}`}>
                  <input 
                    type="radio" 
                    id="entrega1" 
                    name="shipping" 
                    value="pago" 
                    checked={shippingOption === 'pago'}
                    onChange={() => setShippingOption('pago')} 
                  />
                  <label htmlFor="entrega1">
                    <span>entrega até sexta-feira, 7 de nov.</span>
                    <span className={styles.price}>R$ 13,66</span>
                  </label>
                </div>
                <div className={`${styles.option} ${shippingOption === 'gratis' ? styles.selected : ''}`}>
                  <input 
                    type="radio" 
                    id="entrega2" 
                    name="shipping" 
                    value="gratis"
                    checked={shippingOption === 'gratis'}
                    onChange={() => setShippingOption('gratis')}
                  />
                  <label htmlFor="entrega2">
                    <span>entrega até sexta-feira, 14 de nov.</span>
                    <span className={styles.freeShipping}>Grátis</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna da Direita */}
          <div className={styles.rightColumn}>
            {/* Seção de Cupom */}
            <div className={styles.couponSection}>
              <h2 className={styles.sectionTitle}>Cupom</h2>
              <div className={styles.inputGroupRow}>
                <input type="text" placeholder="Cupom" className={styles.couponInput} />
                <button type="button" className={styles.addButton}>
                  Adicionar
                </button>
              </div>
            </div>

            {/* Resumo do Pedido */}
            <div className={styles.summarySection}>
              <h2 className={styles.sectionTitle}>Resumo do pedido</h2>
              
              <div className={styles.summaryRow}>
                <span>Subtotal ({cartItems.length})</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Entrega</span>
                {/* Mostra o custo do frete ou "Grátis" com base no estado */}
                <span>{shippingCost > 0 ? `R$ ${shippingCost.toFixed(2)}` : 'Grátis'}</span>
              </div>
              <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                <span>Total</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
              
              {/* Botões Condicionais */}
              {isEmpty ? (
                <Link to="/" className={styles.backButton}>
                  Voltar para página de início
                </Link>
              ) : (
                <div className={styles.checkoutButtons}>
                  <button className={styles.checkoutButton}>
                    IR PARA O PAGAMENTO
                  </button>
                  <Link to="/" className={styles.keepShoppingButton}>
                    CONTINUAR COMPRANDO
                  </Link>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      <HomeFooter />
    </div>
  );
};

export default CartPage;