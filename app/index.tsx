import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../src/store/authStore';
import { Colors } from '../src/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'vera_onboarding_done';

export default function Index() {
  const router = useRouter();
  const { isLoading, mode, buyerToken, providerToken } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    const navigate = async () => {
      // Check if onboarding was seen
      const onboardingDone = await AsyncStorage.getItem(ONBOARDING_KEY);
      
      if (!onboardingDone) {
        router.replace('/onboarding');
        return;
      }

      if (mode === 'buyer' && buyerToken) {
        router.replace('/(buyer)');
      } else if (mode === 'provider' && providerToken) {
        router.replace('/(provider)');
      } else {
        router.replace('/(auth)/login');
      }
    };

    navigate();
  }, [isLoading, mode, buyerToken, providerToken]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
