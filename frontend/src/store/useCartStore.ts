import { create } from 'zustand';

export interface CartItem {
  id: string; // matches variant_id
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  attributes: Record<string, string>;
  image_url?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: JSON.parse(localStorage.getItem('cart') || '[]'),

  addItem: (newItem) => {
    const currentItems = get().items;
    const existingIndex = currentItems.findIndex((item) => item.id === newItem.id);

    let updatedItems;
    if (existingIndex > -1) {
      updatedItems = [...currentItems];
      updatedItems[existingIndex].quantity += newItem.quantity;
    } else {
      updatedItems = [...currentItems, newItem];
    }

    localStorage.setItem('cart', JSON.stringify(updatedItems));
    set({ items: updatedItems });
  },

  removeItem: (variantId) => {
    const updatedItems = get().items.filter((item) => item.id !== variantId);
    localStorage.setItem('cart', JSON.stringify(updatedItems));
    set({ items: updatedItems });
  },

  updateQuantity: (variantId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(variantId);
      return;
    }

    const updatedItems = get().items.map((item) =>
      item.id === variantId ? { ...item, quantity } : item
    );

    localStorage.setItem('cart', JSON.stringify(updatedItems));
    set({ items: updatedItems });
  },

  clearCart: () => {
    localStorage.removeItem('cart');
    set({ items: [] });
  },

  getCartTotal: () => {
    return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
  },

  getCartCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  },
}));
