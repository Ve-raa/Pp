import { Platform } from 'react-native';
import { buyerGet, buyerPost } from './client';
import type { Order, PaymentInitRequest, PaymentInitResponse } from '../types';

// ─── Replit API Server URL ─────────────────────────────────────────────────────
// On native, orders/payments go to the Replit API server directly.
// On web, the preview proxy routes /api/* to the correct server.
const REPLIT_API_URL = (process.env.EXPO_PUBLIC_REPLIT_API_URL ?? '').replace(/\/$/, '');

/**
 * Build an absolute URL for the Replit API server when on native,
 * or a relative path when on web (proxy handles it).
 */
function replitUrl(path: string): string {
  if (Platform.OS !== 'web' && REPLIT_API_URL) {
    return `${REPLIT_API_URL}${path}`;
  }
  return path;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function getOrders(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<{ orders: Order[]; total: number; page: number; totalPages: number }> {
  const data = await buyerGet<any>(replitUrl('/api/buyer/orders'), params as Record<string, unknown>);
  return {
    orders: data?.orders ?? (Array.isArray(data) ? data : []),
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    totalPages: data?.totalPages ?? 1,
  };
}

export async function getOrderById(id: string): Promise<Order> {
  const data = await buyerGet<any>(replitUrl(`/api/buyer/orders/${id}`));
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
  const res = await buyerPost<any>(replitUrl('/api/buyer/orders'), data);
  return res?.order ?? res;
}

export async function cancelOrder(orderId: string, reason?: string): Promise<{ message: string }> {
  return buyerPost(replitUrl(`/api/buyer/orders/${orderId}/cancel`), { reason });
}

export async function updateOrderPayment(
  orderId: string,
  data: { paymentId?: string; paymentStatus?: string },
): Promise<{ message: string }> {
  return buyerPost(replitUrl(`/api/buyer/orders/${orderId}/payment`), data);
}

export async function rateOrder(
  orderId: string,
  data: { rating: number; review?: string },
): Promise<{ message: string }> {
  // Rating endpoint lives on the main veraapp backend
  return buyerPost(`/api/buyer/orders/${orderId}/review`, data);
}

// ─── Payment ──────────────────────────────────────────────────────────────────
// Stripe, Tabby, Tamara → all handled by the Replit API server.
// On native: use EXPO_PUBLIC_REPLIT_API_URL.
// On web: use relative path — the preview proxy routes to the Replit API server.

export async function initPayment(data: PaymentInitRequest): Promise<PaymentInitResponse> {
  const payload: Record<string, unknown> = {
    orderId: data.orderId,
    amount: data.amount,
    buyerId: data.buyerId,
    returnUrl: data.returnUrl ?? 'https://veraapp.app/payment/return',
    cancelUrl: data.cancelUrl ?? 'https://veraapp.app/payment/cancel',
    currency: 'aed',
  };

  const methodMap: Record<string, string> = {
    stripe: '/api/payments/stripe',
    tabby: '/api/payments/tabby',
    tamara: '/api/payments/tamara',
  };

  const endpoint = replitUrl(methodMap[data.method] ?? '/api/payments/stripe');
  const res = await buyerPost<any>(endpoint, payload);

  if (data.method === 'stripe' && res?.error) {
    throw new Error(res.error);
  }

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
  return buyerPost(replitUrl('/api/payments/stripe/session/' + paymentId), {});
}
