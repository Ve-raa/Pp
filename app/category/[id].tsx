import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { ServiceCard } from '../../src/components/common/ServiceCard';
import { EmptyState } from '../../src/components/common/EmptyState';
import { Header } from '../../src/components/common/Header';
import { getServicesByCategory, getCategoryById } from '../../src/api/categories';

const SORT_OPTIONS = [
  { label: 'الأحدث', value: 'newest' },
  { label: 'الأعلى تقييماً', value: 'rating' },
  { label: 'الأرخص', value: 'price_asc' },
  { label: 'الأغلى', value: 'price_desc' },
];

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  const { data: category } = useQuery({
    queryKey: ['category', id],
    queryFn: () => getCategoryById(id!),
    enabled: !!id && id !== 'all',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['category-services', id, sort, page],
    queryFn: () => getServicesByCategory(id!, { sort, page, limit: 20 }),
    enabled: !!id,
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title={category?.name || 'تصفح الخدمات'} showBack />

      {/* Sort chips */}
      <View style={styles.sortContainer}>
        <FlatList
          horizontal
          data={SORT_OPTIONS}
          keyExtractor={(s) => s.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSort(item.value)}
              style={[styles.chip, sort === item.value && styles.chipActive]}
            >
              <Text style={[styles.chipText, sort === item.value && styles.chipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : !data?.services.length ? (
        <EmptyState
          icon="cube-outline"
          title="لا توجد خدمات"
          subtitle="لا توجد خدمات في هذا القسم حالياً"
        />
      ) : (
        <FlatList
          data={data.services}
          keyExtractor={(s) => s.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.count}>{data.total} خدمة</Text>
          }
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
  sortContainer: { paddingVertical: 10 },
  chip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: Colors.lightPurple, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontFamily: 'Cairo_600SemiBold', fontSize: 12, color: Colors.purpleMid },
  chipTextActive: { color: '#fff' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  grid: { paddingHorizontal: 16, paddingBottom: 80 },
  gridRow: { gap: 12, marginBottom: 0 },
  count: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: Colors.textMuted, textAlign: 'right', marginBottom: 12 },
});
