import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useAuthStore } from '../src/store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'vera_onboarding_done';

export default function Index() {
  const router = useRouter();
  const { isLoading, mode, buyerToken, providerToken } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    const navigate = async () => {
      const onboardingDone = await AsyncStorage.getItem(ONBOARDING_KEY);

      if (!onboardingDone) {
        router.replace('/onboarding');
        return;
      }

      if (mode === 'provider' && providerToken) {
        router.replace('/(provider)');
      } else {
        router.replace('/(buyer)');
      }
    };

    navigate();
  }, [isLoading, mode, buyerToken, providerToken]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.brand}>VÉRA</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 28,
    marginBottom: 20,
  },
  brand: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 32,
    color: '#fff',
    letterSpacing: 6,
  },
});
