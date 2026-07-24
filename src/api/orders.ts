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
// For Stripe we call our own Replit API server (which holds the secret key securely).
// For Tabby / Tamara we still route through the main veraapp backend.
const STRIPE_PAYMENT_URL =
  process.env.EXPO_PUBLIC_STRIPE_API_URL ||
  (process.env.EXPO_PUBLIC_API_URL ? process.env.EXPO_PUBLIC_API_URL + '/api/payments/stripe' : null);

export async function initPayment(data: PaymentInitRequest): Promise<PaymentInitResponse> {
  const payload: Record<string, unknown> = {
    orderId: data.orderId,
    amount: data.amount,
    buyerId: data.buyerId,
    returnUrl: data.returnUrl ?? 'https://veraapp.app/payment/return',
    cancelUrl: data.cancelUrl ?? 'https://veraapp.app/payment/cancel',
    currency: 'aed',
  };

  if (data.method === 'stripe') {
    // Call our Replit API server for Stripe
    const stripeEndpoint = STRIPE_PAYMENT_URL ?? '/api/payments/stripe';
    const res = await buyerPost<any>(stripeEndpoint, payload);
    if (res?.error) {
      throw new Error(res.error);
    }
    return {
      paymentUrl: res?.url ?? res?.checkoutUrl ?? res?.paymentUrl,
      paymentId: res?.sessionId ?? res?.paymentId ?? res?.id,
      clientSecret: res?.clientSecret,
      status: res?.status ?? 'pending',
      demo: false,
    };
  }

  // Tabby / Tamara — routed through veraapp backend
  const methodMap: Record<string, string> = {
    tabby: '/api/payments/tabby',
    tamara: '/api/payments/tamara',
  };
  const endpoint = methodMap[data.method] ?? '/api/payments/stripe';
  const res = await buyerPost<any>(endpoint, payload);
  return {
    paymentUrl: res?.url ?? res?.checkoutUrl ?? res?.paymentUrl,
    paymentId: res?.sessionId ?? res?.paymentId ?? res?.id,
    clientSecret: res?.clientSecret,
    status: res?.status ?? 'pending',
    demo: res?.demo === true,
    message: res?.message,
  };
}

export async function verifyPayment(paymentId: string): Promise<{ status: string; orderId?: string }> {
  return buyerPost('/api/buyer/wallet/verify', { sessionId: paymentId });
}
