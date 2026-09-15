'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/api';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResult {
  notifications: AppNotification[];
  unreadCount: number;
}

async function getToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('jobpilot_token')?.value;
}

export async function getNotifications(): Promise<NotificationsResult> {
  const token = await getToken();

  if (!token) {
    return { notifications: [], unreadCount: 0 };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications`, {
      headers: { Cookie: `jobpilot_token=${token}` },
      cache: 'no-store',
    });

    if (!response.ok) {
      return { notifications: [], unreadCount: 0 };
    }

    const data = (await response.json()) as NotificationsResult;
    return { notifications: data.notifications ?? [], unreadCount: data.unreadCount ?? 0 };
  } catch {
    return { notifications: [], unreadCount: 0 };
  }
}

export async function markNotificationReadAction(notificationId: string): Promise<void> {
  const token = await getToken();
  if (!token) return;

  await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: { Cookie: `jobpilot_token=${token}` },
    cache: 'no-store',
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/notifications');
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const token = await getToken();
  if (!token) return;

  await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
    method: 'PATCH',
    headers: { Cookie: `jobpilot_token=${token}` },
    cache: 'no-store',
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/notifications');
}
