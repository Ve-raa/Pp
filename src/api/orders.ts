import { buyerGet, buyerPost } from './client';
import type { Order, PaymentInitRequest, PaymentInitResponse } from '../types';

export async function getOrders(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<{ orders: Order[]; total: number; page: number; totalPages: number }> {
  const data = await buyerGet<any>('/api/buyer/orders', params as Record<string, unknown>);
  return {
    orders: data?.orders ?? data ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    totalPages: data?.totalPages ?? 1,
  };
}

export async function getOrderById(id: string): Promise<Order> {
  const data = await buyerGet<any>(`/api/buyer/orders/${id}`);
  return data?.order ?? data;
}

export async function createOrder(data: {
  cartId?: string;
  items?: { serviceId: string; quantity: number; notes?: string }[];
  paymentMethod: string;
  promoCode?: string;
  address?: string;
  notes?: string;
}): Promise<Order> {
  const res = await buyerPost<any>('/api/buyer/orders', data);
  return res?.order ?? res;
}

export async function cancelOrder(orderId: string, reason?: string): Promise<{ message: string }> {
  return buyerPost(`/api/buyer/orders/${orderId}/cancel`, { reason });
}

export async function rateOrder(orderId: string, data: {
  rating: number;
  review?: string;
}): Promise<{ message: string }> {
  return buyerPost(`/api/buyer/orders/${orderId}/review`, data);
}

// ─── Payment ──────────────────────────────────────────────────────────────────
// Routes to the correct gateway endpoint based on payment method
export async function initPayment(data: PaymentInitRequest): Promise<PaymentInitResponse> {
  const methodMap: Record<string, string> = {
    stripe: '/api/payments/stripe',
    tabby: '/api/payments/tabby',
    tamara: '/api/payments/tamara',
  };
  const endpoint = methodMap[data.method] ?? '/api/payments/stripe';

  const payload: Record<string, unknown> = {
    orderId: data.orderId,
    returnUrl: data.returnUrl ?? 'vera://payment/return',
    cancelUrl: data.cancelUrl ?? 'vera://payment/cancel',
  };

  const res = await buyerPost<any>(endpoint, payload);
  return {
    paymentUrl: res?.url ?? res?.checkoutUrl ?? res?.paymentUrl,
    paymentId: res?.sessionId ?? res?.paymentId ?? res?.id,
    clientSecret: res?.clientSecret,
  };
}

export async function verifyPayment(paymentId: string): Promise<{ status: string; orderId?: string }> {
  return buyerPost('/api/buyer/wallet/verify', { sessionId: paymentId });
}
