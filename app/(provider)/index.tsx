import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';
import { Colors } from '../../src/constants/colors';

export default function ProviderIndex() {
  const router = useRouter();
  const { providerToken, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;
    if (providerToken) {
      router.replace('/(provider)/dashboard');
    } else {
      router.replace('/(provider)/login');
    }
  }, [isLoading, providerToken]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
});
