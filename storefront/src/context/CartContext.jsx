import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext'; // Importa seu AuthContext existente

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const { user } = useAuth(); // Pega o usuário do seu AuthContext

  // Função para pegar a chave correta do localStorage
  const getStorageKey = () => {
    return user ? `cart_${user.id}` : 'cart_guest';
  };

  // Efeito para CARREGAR o carrinho quando o usuário muda (login/logout)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storageKey = getStorageKey();
      const storedCart = localStorage.getItem(storageKey);
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      } else {
        setCartItems([]); // Limpa o carrinho se não houver nada salvo
      }
    }
  }, [user]); // Dispara toda vez que o 'user' mudar

  // Efeito para SALVAR o carrinho quando os itens mudam
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(cartItems));
    }
  }, [cartItems, user]); // Salva toda vez que 'cartItems' ou 'user' mudar

  // --- FUNÇÕES DE MANIPULAÇÃO DO CARRINHO ---

  const addToCart = (product, quantity) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        // Se já existe, atualiza a quantidade
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Se não existe, adiciona o produto ao carrinho
        // Certifique-se de que o produto tenha id, nome, preco, etc.
        // E adicione a imagem
        const imageUrl = product.imagem_url 
          ? `http://localhost:3001${product.imagem_url}` 
          : '/listen.png'; // Placeholder

        return [...prevItems, { 
            id: product.id, 
            name: product.nome, 
            artist: product.artista, // Assumindo que seu produto tem 'artista'
            price: parseFloat(product.preco), 
            quantity, 
            image: imageUrl 
        }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId); // Remove se a quantidade for menor que 1
      return;
    }
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Valor que o provider vai fornecer para todos os componentes
  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};