import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';

/**
 * Admin Layout — محمي بحماية تسجيل الدخول.
 * يُحوّل المستخدم غير المسجّل إلى شاشة الدخول.
 * لإضافة تحقق حقيقي من صلاحية admin، تحقق من علامة isAdmin
 * التي يُعيدها الخادم عند تسجيل الدخول.
 */
export default function AdminLayout() {
  const router = useRouter();
  const { providerUser, buyerUser, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;
    if (!providerUser && !buyerUser) {
      router.replace('/(auth)/login');
    }
  }, [isLoading, providerUser, buyerUser]);

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="banners" />
    </Stack>
  );
}
