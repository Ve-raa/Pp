import { buyerGet, buyerPost } from './client';
import type { Wallet, WalletTransaction } from '../types';

export async function getWallet(): Promise<Wallet> {
  const data = await buyerGet<any>('/api/buyer/wallet');
  return data?.wallet ?? data;
}

export async function getWalletTransactions(params?: {
  page?: number;
  limit?: number;
  type?: 'credit' | 'debit';
}): Promise<{ transactions: WalletTransaction[]; total: number }> {
  const data = await buyerGet<any>('/api/buyer/wallet', params as Record<string, unknown>);
  return {
    transactions: data?.transactions ?? [],
    total: data?.total ?? 0,
  };
}

export async function topUpWallet(amount: number, _method?: string): Promise<{
  paymentUrl?: string;
  clientSecret?: string;
  message?: string;
}> {
  // Backend endpoint: POST /api/buyer/wallet/topup { amount }
  const res = await buyerPost<any>('/api/buyer/wallet/topup', { amount });
  return {
    paymentUrl: res?.url ?? res?.paymentUrl,
    clientSecret: res?.clientSecret,
    message: res?.message,
  };
}
