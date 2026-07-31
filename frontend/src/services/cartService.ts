import { apiClient } from '@/lib/api-client';

export interface CartItem {
  id: string; // BigInt from backend (serialized as string)
  cart_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  product_name_snapshot: string;
  variant_attributes_snapshot: Record<string, string>;
  unit_price_snapshot: string;
  image_url?: string;
}

export interface Cart {
  id: string;
  user_id: string;
  items: CartItem[];
  created_at: string;
  updated_at: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function getCart(): Promise<Cart> {
  const { data } = await apiClient.get<ApiEnvelope<Cart>>('/cart');
  return data.data;
}

export async function addItemToCart(
  product_id: string,
  variant_id: string,
  quantity: number
): Promise<Cart> {
  const { data } = await apiClient.post<ApiEnvelope<Cart>>('/cart/items', {
    product_id,
    variant_id,
    quantity,
  });
  return data.data;
}

export async function updateCartItem(variant_id: string, quantity: number): Promise<Cart> {
  const { data } = await apiClient.put<ApiEnvelope<Cart>>(`/cart/items/${variant_id}`, {
    quantity,
  });
  return data.data;
}

export async function removeCartItem(variant_id: string): Promise<Cart> {
  const { data } = await apiClient.delete<ApiEnvelope<Cart>>(`/cart/items/${variant_id}`);
  return data.data;
}

export async function clearCart(): Promise<void> {
  await apiClient.delete('/cart');
}
