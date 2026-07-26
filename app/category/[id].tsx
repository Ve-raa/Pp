import React, { useMemo, useState } from 'react';
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
  const [selectedSubcat, setSelectedSubcat] = useState<string | null>(null);

  const { data: category } = useQuery({
    queryKey: ['category', id],
    queryFn: () => getCategoryById(id!),
    enabled: !!id && id !== 'all',
  });

  // Fetch a large page so all subcategories are visible in the filter bar
  const { data, isLoading } = useQuery({
    queryKey: ['category-services', id, sort],
    queryFn: () => getServicesByCategory(id!, { sort, limit: 100 }),
    enabled: !!id,
  });

  // Derive unique subcategory labels from the loaded services
  const subcategories = useMemo(() => {
    if (!data?.services?.length) return [];
    const seen = new Set<string>();
    const result: string[] = [];
    for (const s of data.services) {
      if (s.subcategory && !seen.has(s.subcategory)) {
        seen.add(s.subcategory);
        result.push(s.subcategory);
      }
    }
    return result;
  }, [data]);

  // Filter services locally by selected subcategory
  const filteredServices = useMemo(() => {
    if (!data?.services) return [];
    if (!selectedSubcat) return data.services;
    return data.services.filter((s) => s.subcategory === selectedSubcat);
  }, [data, selectedSubcat]);

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
              onPress={() => { setSort(item.value); setSelectedSubcat(null); }}
              style={[styles.chip, sort === item.value && !selectedSubcat && styles.chipActive]}
            >
              <Text style={[styles.chipText, sort === item.value && !selectedSubcat && styles.chipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Subcategory filter chips (shown only when subcategories exist) */}
      {subcategories.length > 0 && (
        <View style={styles.subcatContainer}>
          <FlatList
            horizontal
            data={subcategories}
            keyExtractor={(s) => s}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            ListHeaderComponent={
              <TouchableOpacity
                onPress={() => setSelectedSubcat(null)}
                style={[styles.subcatChip, !selectedSubcat && styles.subcatChipActive]}
              >
                <Text style={[styles.subcatText, !selectedSubcat && styles.subcatTextActive]}>
                  الكل
                </Text>
              </TouchableOpacity>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedSubcat(item === selectedSubcat ? null : item)}
                style={[styles.subcatChip, selectedSubcat === item && styles.subcatChipActive]}
              >
                <Text style={[styles.subcatText, selectedSubcat === item && styles.subcatTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : !filteredServices.length ? (
        <EmptyState
          icon="cube-outline"
          title="لا توجد خدمات"
          subtitle="لا توجد خدمات في هذا القسم حالياً"
        />
      ) : (
        <FlatList
          data={filteredServices}
          keyExtractor={(s) => s.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.count}>{filteredServices.length} خدمة</Text>
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
  subcatContainer: { paddingBottom: 10 },
  chip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: Colors.lightPurple, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontFamily: 'Cairo_600SemiBold', fontSize: 12, color: Colors.purpleMid },
  chipTextActive: { color: '#fff' },
  subcatChip: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 16, backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border },
  subcatChipActive: { backgroundColor: Colors.purpleDark, borderColor: Colors.purpleDark },
  subcatText: { fontFamily: 'Cairo_400Regular', fontSize: 11, color: Colors.textMuted },
  subcatTextActive: { color: '#fff', fontFamily: 'Cairo_600SemiBold' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  grid: { paddingHorizontal: 16, paddingBottom: 80 },
  gridRow: { gap: 12, marginBottom: 0 },
  count: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: Colors.textMuted, textAlign: 'right', marginBottom: 12 },
});
