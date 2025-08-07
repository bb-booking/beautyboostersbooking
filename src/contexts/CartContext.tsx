import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface CartItem {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  duration: number;
  category: string;
  people: number;
  boosters: number;
  finalPrice: number;
  totalDuration: number;
  groupPricing?: {
    1: number;
    2: number;
    3: number;
    4: number;
  };
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalDuration: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (item: CartItem) => {
    setItems(prev => [...prev, { ...item, id: `${item.id}-${Date.now()}` }]);
  };

  const removeFromCart = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.finalPrice, 0);
  };

  const getTotalDuration = () => {
    return items.reduce((total, item) => total + item.totalDuration, 0);
  };

  const getItemCount = () => {
    return items.length;
  };

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      clearCart,
      getTotalPrice,
      getTotalDuration,
      getItemCount
    }}>
      {children}
    </CartContext.Provider>
  );
};