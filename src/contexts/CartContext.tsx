import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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

// Load cart from sessionStorage
const loadCartFromStorage = (): CartItem[] => {
  try {
    const stored = sessionStorage.getItem('cart');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  return [];
};

// Save cart to sessionStorage
const saveCartToStorage = (items: CartItem[]) => {
  try {
    sessionStorage.setItem('cart', JSON.stringify(items));
  } catch {}
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(loadCartFromStorage);

  // Save cart synchronously to ensure it's persisted before navigation
  const addToCart = (item: CartItem) => {
    const newItem = { ...item, id: `${item.id}-${Date.now()}` };
    setItems(prev => {
      const newItems = [...prev, newItem];
      // Save synchronously - critical for navigation timing
      saveCartToStorage(newItems);
      return newItems;
    });
  };

  const removeFromCart = (id: string) => {
    setItems(prev => {
      const newItems = prev.filter(item => item.id !== id);
      saveCartToStorage(newItems);
      return newItems;
    });
  };

  const clearCart = () => {
    setItems([]);
    try {
      sessionStorage.removeItem('cart');
    } catch {}
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