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
  const data = await buyerGet<any>('/api/loyalty', params as Record<string, unknown>);
  return {
    history: data?.history ?? [],
    total: data?.total ?? 0,
  };
}
