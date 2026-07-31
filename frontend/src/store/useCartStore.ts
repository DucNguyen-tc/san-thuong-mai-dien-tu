import { create } from 'zustand';
import * as cartService from '@/services/cartService';

export interface LocalCartItem {
  id: string; // The backend CartItem ID (BigInt serialized as string)
  variant_id: string; // To match which variant it is
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  attributes: Record<string, string>;
  image_url?: string;
}

interface CartState {
  items: LocalCartItem[];
  isLoading: boolean;
  
  // Hành động gọi API
  fetchCart: () => Promise<void>;
  addItem: (product_id: string, variant_id: string, quantity: number, localMeta: Omit<LocalCartItem, 'id' | 'product_id' | 'variant_id' | 'quantity'>) => Promise<void>;
  // Cập nhật và Xóa theo cart_item_id (id) thay vì variant_id
  updateQuantity: (cart_item_id: string, quantity: number) => Promise<void>;
  removeItem: (cart_item_id: string) => Promise<void>;
  clearCart: () => Promise<void>;
  
  // Utilities
  getCartTotal: () => number;
  getCartCount: () => number;
}

// Hàm map dữ liệu backend trả về thành định dạng LocalCartItem hiển thị trên UI
const mapBackendCartToLocal = (backendCart: cartService.Cart): LocalCartItem[] => {
  if (!backendCart || !backendCart.items) return [];
  return backendCart.items.map(item => ({
    id: item.id, // ID của record cart_item
    variant_id: item.variant_id,
    product_id: item.product_id,
    quantity: item.quantity,
    price: Number(item.unit_price_snapshot) || 0, 
    name: item.product_name_snapshot || 'Sản phẩm',
    attributes: item.variant_attributes_snapshot || {},
    image_url: item.image_url || 'https://placehold.co/400x400?text=No+Image',
  }));
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const cart = await cartService.getCart();
      set({ items: mapBackendCartToLocal(cart) });
    } catch (error) {
      console.error('Lỗi khi fetch giỏ hàng:', error);
      // Nếu chưa đăng nhập hoặc lỗi, set rỗng (hoặc có thể load từ localStorage nếu làm tính năng merge)
      set({ items: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (product_id, variant_id, quantity, localMeta) => {
    set({ isLoading: true });
    try {
      await cartService.addItemToCart(product_id, variant_id, quantity);
      await get().fetchCart(); // Fetch lại toàn bộ giỏ hàng cho chắc chắn
    } catch (error) {
      console.error('Lỗi khi thêm vào giỏ hàng:', error);
      throw error; 
    } finally {
      set({ isLoading: false });
    }
  },

  updateQuantity: async (cart_item_id, quantity) => {
    if (quantity <= 0) {
      return get().removeItem(cart_item_id);
    }
    
    // Optimistic update
    const prevItems = get().items;
    set({ items: prevItems.map(item => item.id === cart_item_id ? { ...item, quantity } : item) });

    try {
      await cartService.updateCartItem(cart_item_id, quantity);
    } catch (error) {
      console.error('Lỗi khi cập nhật số lượng:', error);
      set({ items: prevItems }); // Rollback nếu lỗi
      throw error;
    }
  },

  removeItem: async (cart_item_id) => {
    // Optimistic update
    const prevItems = get().items;
    set({ items: prevItems.filter(item => item.id !== cart_item_id) });

    try {
      await cartService.removeCartItem(cart_item_id);
    } catch (error) {
      console.error('Lỗi khi xóa sản phẩm khỏi giỏ:', error);
      set({ items: prevItems }); // Rollback nếu lỗi
      throw error;
    }
  },

  clearCart: async () => {
    try {
      await cartService.clearCart();
      set({ items: [] });
    } catch (error) {
      console.error('Lỗi khi làm trống giỏ hàng:', error);
      throw error;
    }
  },

  getCartTotal: () => {
    return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
  },

  getCartCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  },
}));
