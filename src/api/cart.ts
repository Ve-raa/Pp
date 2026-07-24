import { buyerGet, buyerPost, buyerPut, buyerDelete } from './client';
import type { Cart, PromoCodeResponse } from '../types';

export async function getCart(): Promise<Cart> {
  return buyerGet<Cart>('/api/buyer/cart');
}

export async function addToCart(serviceId: string, quantity = 1, notes?: string): Promise<Cart> {
  return buyerPost<Cart>('/api/buyer/cart/items', { serviceId, quantity, notes });
}

export async function updateCartItem(itemId: string, quantity: number): Promise<Cart> {
  return buyerPut<Cart>(`/api/buyer/cart/items/${itemId}`, { quantity });
}

export async function removeFromCart(itemId: string): Promise<Cart> {
  return buyerDelete<Cart>(`/api/buyer/cart/items/${itemId}`);
}

export async function clearCart(): Promise<{ message: string }> {
  return buyerDelete('/api/buyer/cart');
}

export async function applyPromoCode(code: string): Promise<PromoCodeResponse> {
  return buyerPost<PromoCodeResponse>('/api/buyer/cart/promo', { code });
}

export async function removePromoCode(): Promise<{ message: string }> {
  return buyerDelete('/api/buyer/cart/promo');
}
