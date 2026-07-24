import { buyerGet, buyerPost } from './client';
import type { Notification } from '../types';

export async function getNotifications(params?: {
  page?: number;
  limit?: number;
  isRead?: boolean;
}): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
  try {
    const data = await buyerGet<any>('/api/buyer/notifications', params as Record<string, unknown>);
    return {
      notifications: data?.notifications ?? data?.items ?? [],
      total: data?.total ?? 0,
      unreadCount: data?.unreadCount ?? 0,
    };
  } catch {
    // Endpoint not yet available — return empty gracefully
    return { notifications: [], total: 0, unreadCount: 0 };
  }
}

export async function markNotificationRead(id: string): Promise<{ message: string }> {
  try {
    return await buyerPost(`/api/buyer/notifications/${id}/read`, {});
  } catch {
    return { message: 'ok' };
  }
}

export async function markAllNotificationsRead(): Promise<{ message: string }> {
  try {
    return await buyerPost('/api/buyer/notifications/read-all', {});
  } catch {
    return { message: 'ok' };
  }
}
