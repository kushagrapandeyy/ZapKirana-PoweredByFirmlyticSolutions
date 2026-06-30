import React, { createContext, useContext, useState, ReactNode } from 'react';

type Product = {
  id: string;
  name: string;
  price: number;
  time: string;
  image: string;
  gstClass?: string;
};

type CartItem = {
  product: Product;
  qty: number;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartItemsCount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === productId);
      if (existing && existing.qty > 1) {
        return prev.map(item => 
          item.product.id === productId ? { ...item, qty: item.qty - 1 } : item
        );
      }
      return prev.filter(item => item.product.id !== productId);
    });
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, cartTotal, cartItemsCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
