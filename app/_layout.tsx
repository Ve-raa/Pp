import { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts, Cairo_400Regular, Cairo_600SemiBold, Cairo_700Bold } from '@expo-google-fonts/cairo';
import * as SplashScreen from 'expo-splash-screen';
import { I18nManager, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../src/store/authStore';
import { setUnauthorizedHandler } from '../src/api/client';

// Force RTL for Arabic
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function RootLayout() {
  const { hydrateFromStorage, logoutAll } = useAuthStore();
  const router = useRouter();
  const isNavigationReady = useRef(false);

  const [fontsLoaded, fontError] = useFonts({
    Cairo_400Regular,
    Cairo_600SemiBold,
    Cairo_700Bold,
  });

  // Register the 401 unauthorized handler once the router is mounted.
  // When any API call returns 401, clear the session and redirect to login.
  useEffect(() => {
    isNavigationReady.current = true;
    setUnauthorizedHandler(() => {
      logoutAll().then(() => {
        try {
          router.replace('/(auth)/login');
        } catch {
          // Router may not be mounted yet; index.tsx will redirect on next render
        }
      });
    });
  }, []);

  useEffect(() => {
    hydrateFromStorage();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(buyer)" />
            <Stack.Screen name="(provider)" />
            <Stack.Screen name="service/[id]" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="category/[id]" />
            <Stack.Screen name="order/[id]" />
            <Stack.Screen name="checkout" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="wishlist" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="wallet" />
            <Stack.Screen name="loyalty" />
            <Stack.Screen name="support" />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
