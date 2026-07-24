import React from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../src/constants/colors';
import { ServiceCard } from '../src/components/common/ServiceCard';
import { EmptyState } from '../src/components/common/EmptyState';
import { Header } from '../src/components/common/Header';
import { getWishlist } from '../src/api/services';

export default function WishlistScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: getWishlist,
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title={`المفضلة (${services.length})`} showBack />
      {isLoading ? (
        <View style={styles.loading}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : services.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title="لا توجد خدمات مفضلة"
          subtitle="أضف الخدمات التي تعجبك إلى المفضلة لتجدها بسرعة"
          actionLabel="تصفح الخدمات"
          onAction={() => router.push('/(buyer)')}
        />
      ) : (
        <FlatList
          data={services}
          keyExtractor={(s) => s.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <ServiceCard
              service={item}
              onPress={() => router.push(`/service/${item.id}`)}
              variant="grid"
            />
          )}
          ListFooterComponent={<View style={{ height: 80 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  grid: { padding: 16 },
  row: { gap: 12, marginBottom: 0 },
});
