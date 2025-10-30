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
  useEffect(() => {
    saveCart(cartItems);
  }, [cartItems]);

  /**
   * Adiciona um produto ao carrinho ou atualiza sua quantidade.
   * @param {object} product - O objeto do produto (deve conter id, nome, preco, imagem, artista).
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
        
        // --- INÍCIO DA CORREÇÃO ---
        
        // 1. Definimos a URL base do servidor (onde as imagens estão)
        // (Baseado no seu server.js e api.js)
        const SERVER_URL = 'http://localhost:3000';

        // 2. Construímos a URL completa da imagem
        // (product.imagem vem da API e é só o nome do arquivo)
        const imageUrl = `${SERVER_URL}/uploads/${product.imagem}`;

        // 3. Mapeamos os campos do 'product' (vindo da API) para os campos
        //    que o 'CartPage.jsx' espera (name, artist, price, image)
        updatedItems = [...currentItems, { 
          id: product.id,
          name: product.nome,       // Mapeia 'nome' para 'name'
          artist: product.artista,  // Mapeia 'artista' para 'artist'
          price: product.preco,     // Mapeia 'preco' para 'price'
          image: imageUrl,          // Salva a URL completa em 'image'
          quantity
        }];
        // --- FIM DA CORREÇÃO ---
      }
      
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
      return updatedItems;
    });
  };

  /**
   * Limpa todo o carrinho.
   */
  const clearCart = () => {
    setCartItems([]);
  };

  // Calcula o total do carrinho
  // --- CORREÇÃO APLICADA ---
  // Agora usamos 'item.price' para calcular o total, pois foi o que salvamos
  const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // O valor fornecido pelo contexto
  const value = {
    cartItems,
    addToCart,
    // --- CORREÇÃO APLICADA ---
    // Renomeia 'updateCartQuantity' para 'updateQuantity' para corresponder
    // ao que o CartPage.jsx importa (const { ... updateQuantity } = useCart())
    updateQuantity: updateCartQuantity,
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