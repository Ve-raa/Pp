import { providerGet, providerPost, providerPut } from './client';
import type {
  ProviderDashboard,
  ProviderEarnings,
  Service,
  Order,
  ProviderUser,
} from '../types';

// ─── Dashboard ────────────────────────────────────────────────────────────────
export async function getProviderDashboard(): Promise<ProviderDashboard> {
  const data = await providerGet<any>('/api/provider/summary');
  return {
    totalOrders: data?.orders?.total ?? data?.totalOrders ?? 0,
    pendingOrders: data?.orders?.pending ?? data?.pendingOrders ?? 0,
    completedOrders: data?.orders?.completed ?? data?.completedOrders ?? 0,
    totalEarnings: data?.earnings?.total ?? data?.totalEarnings ?? 0,
    thisMonthEarnings: data?.earnings?.thisMonth ?? data?.thisMonthEarnings ?? 0,
    rating: data?.rating ?? 0,
    reviewsCount: data?.reviewsCount ?? 0,
    activeServices: data?.services?.active ?? data?.activeServices ?? 0,
    recentOrders: data?.recentOrders ?? [],
  };
}

// ─── Services ─────────────────────────────────────────────────────────────────
export async function getProviderServices(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<{ services: Service[]; total: number }> {
  const data = await providerGet<any>('/api/provider/services', params as Record<string, unknown>);
  return {
    services: data?.services ?? data ?? [],
    total: data?.total ?? 0,
  };
}

export async function createProviderService(data: Partial<Service>): Promise<Service> {
  return providerPost<Service>('/api/provider/services', data);
}

export async function updateProviderService(id: string, data: Partial<Service>): Promise<Service> {
  // Backend uses PATCH not PUT
  const res = await import('./client').then(m =>
    m.providerClient.patch<Service>(`/api/provider/services/${id}`, data)
  );
  return res.data;
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export async function getProviderOrders(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<{ orders: Order[]; total: number }> {
  const data = await providerGet<any>('/api/provider/orders', params as Record<string, unknown>);
  return {
    orders: data?.orders ?? data ?? [],
    total: data?.total ?? 0,
  };
}

export async function updateOrderStatus(orderId: string, status: string): Promise<{ message: string }> {
  const res = await import('./client').then(m =>
    m.providerClient.patch<{ message: string }>(`/api/provider/orders`, { orderId, status })
  );
  return res.data;
}

// ─── Earnings ─────────────────────────────────────────────────────────────────
export async function getProviderEarnings(): Promise<ProviderEarnings> {
  const data = await providerGet<any>('/api/provider/earnings');
  return {
    totalEarnings: data?.summary?.total ?? data?.totalEarnings ?? 0,
    pendingPayout: data?.summary?.pending ?? data?.pendingPayout ?? 0,
    paidOut: data?.summary?.paid ?? data?.paidOut ?? 0,
    thisMonth: data?.summary?.thisMonth ?? data?.thisMonth ?? 0,
    lastMonth: data?.summary?.lastMonth ?? data?.lastMonth ?? 0,
    transactions: data?.transactions ?? [],
  };
}

export async function requestPayout(amount: number): Promise<{ message: string }> {
  return providerPost('/api/provider/payouts', { amount });
}

// ─── Profile ──────────────────────────────────────────────────────────────────
export async function getProviderProfile(): Promise<ProviderUser> {
  const data = await providerGet<any>('/api/provider-auth/me');
  return data?.provider ?? data?.user ?? data;
}

export async function updateProviderProfile(data: Partial<ProviderUser>): Promise<ProviderUser> {
  // Backend uses PATCH not PUT
  const res = await import('./client').then(m =>
    m.providerClient.patch<ProviderUser>('/api/provider/profile', data)
  );
  return res.data;
}

// ─── Subscription ─────────────────────────────────────────────────────────────
export async function getSubscriptionPlans(): Promise<{
  id: string;
  name: string;
  price: number;
  features: string[];
}[]> {
  const data = await providerGet<any>('/api/provider/subscription');
  return data?.plans ?? data ?? [];
}

export async function subscribeToplan(planId: string): Promise<{
  paymentUrl?: string;
  message?: string;
}> {
  return providerPost('/api/provider/subscription/purchase', { planId });
}
