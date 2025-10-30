import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

// Função auxiliar para carregar o carrinho do localStorage
const loadCart = () => {
  try {
    const serializedCart = localStorage.getItem('cartItems');
    if (serializedCart === null) {
      return [];
    }
    return JSON.parse(serializedCart);
  } catch (err) {
    console.error("Erro ao carregar o carrinho:", err);
    return [];
  }
};

// Função auxiliar para salvar o carrinho no localStorage
const saveCart = (cartItems) => {
  try {
    const serializedCart = JSON.stringify(cartItems);
    localStorage.setItem('cartItems', serializedCart);
  } catch (err) {
    console.error("Erro ao salvar o carrinho:", err);
  }
};


export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(loadCart()); // Carrega na inicialização

  // Efeito para salvar no localStorage sempre que o cartItems mudar
  // (Nota: Isso foi removido das funções individuais para evitar redundância)
  useEffect(() => {
    saveCart(cartItems);
  }, [cartItems]);

  /**
   * Adiciona um produto ao carrinho ou atualiza sua quantidade.
   * @param {object} product - O objeto do produto (deve conter id, nome, preco, imagem_url).
   * @param {number} quantity - A quantidade a ser adicionada.
   */
  const addToCart = (product, quantity) => {
    setCartItems(currentItems => {
      const existingItemIndex = currentItems.findIndex(item => item.id === product.id);
      
      let updatedItems;

      if (existingItemIndex > -1) {
        // Item já existe, atualiza a quantidade
        updatedItems = [...currentItems];
        updatedItems[existingItemIndex].quantity += quantity;
      } else {
        // Item novo, adiciona ao carrinho
        // --- MUDANÇA APLICADA ---
        // Garantimos que a 'imagem_url' é salva no objeto do carrinho
        updatedItems = [...currentItems, { 
          id: product.id, 
          nome: product.nome, 
          preco: product.preco, 
          imagem_url: product.imagem_url, // <-- ADICIONADO AQUI
          quantity 
        }];
        // --- FIM DA MUDANÇA ---
      }
      
      // saveCart(updatedItems); // Removido, pois o useEffect agora cuida disso
      return updatedItems;
    });
  };

  /**
   * Atualiza a quantidade de um item específico no carrinho.
   * Se a quantidade for < 1, remove o item.
   * @param {number} itemId - O ID do item a ser atualizado.
   * @param {number} newQuantity - A nova quantidade total do item.
   */
  const updateCartQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      // Se a quantidade for zero ou menos, remove o item
      removeFromCart(itemId);
    } else {
      setCartItems(currentItems => {
        const updatedItems = currentItems.map(item => 
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        );
        // saveCart(updatedItems); // Removido
        return updatedItems;
      });
    }
  };

  /**
   * Remove um item completamente do carrinho.
   * @param {number} itemId - O ID do item a ser removido.
   */
  const removeFromCart = (itemId) => {
    setCartItems(currentItems => {
      const updatedItems = currentItems.filter(item => item.id !== itemId);
      // saveCart(updatedItems); // Removido
      return updatedItems;
    });
  };

  /**
   * Limpa todo o carrinho.
   */
  const clearCart = () => {
    setCartItems([]);
    // saveCart([]); // Removido
  };

  // Calcula o total do carrinho
  const total = cartItems.reduce((acc, item) => acc + item.preco * item.quantity, 0);

  // O valor fornecido pelo contexto
  const value = {
    cartItems,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    total,
    itemCount: cartItems.reduce((acc, item) => acc + item.quantity, 0) // Total de unidades
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};