import { buyerGet, buyerPost } from './client';
import type { LoyaltyInfo } from '../types';

export async function getLoyaltyInfo(): Promise<LoyaltyInfo> {
  const data = await buyerGet<any>('/api/loyalty');
  return data?.loyalty ?? data ?? {};
}

export async function redeemLoyaltyPoints(points: number): Promise<{
  message: string;
  discount: number;
  remainingPoints: number;
}> {
  return buyerPost('/api/loyalty/redeem', { points });
}

export async function getLoyaltyHistory(params?: {
  page?: number;
  limit?: number;
}): Promise<{ history: LoyaltyInfo['history']; total: number }> {
  // Dedicated history endpoint instead of the info endpoint
  const data = await buyerGet<any>('/api/loyalty/history', params as Record<string, unknown>);
  return {
    history: data?.history ?? data?.items ?? [],
    total: data?.total ?? 0,
  };
}
