import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../../src/constants/colors';
import { ServiceCard } from '../../src/components/common/ServiceCard';
import { CategoryCard } from '../../src/components/common/CategoryCard';
import { EmptyState } from '../../src/components/common/EmptyState';
import { search } from '../../src/api/search';
import { getCategories } from '../../src/api/categories';

const SORT_OPTIONS = [
  { label: 'الأحدث', value: 'newest' },
  { label: 'الأعلى تقييماً', value: 'rating' },
  { label: 'الأرخص', value: 'price_asc' },
  { label: 'الأغلى', value: 'price_desc' },
];

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeSort, setActiveSort] = useState('newest');
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories });

  const { data: results, isLoading, isFetching } = useQuery({
    queryKey: ['search', debouncedQuery, activeSort],
    queryFn: () => search(debouncedQuery, { sort: activeSort, limit: 20 }),
    enabled: debouncedQuery.length > 1,
  });

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => setDebouncedQuery(text), 500);
    setDebounceTimer(timer);
  };

  const isSearching = isLoading || isFetching;
  const hasResults = !!results && debouncedQuery.length > 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Search Input */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={Colors.purpleMid} />
          <TextInput
            style={styles.input}
            placeholder="ابحث عن خدمات، أقسام..."
            placeholderTextColor={Colors.textLight}
            value={query}
            onChangeText={handleQueryChange}
            autoFocus
            textAlign="right"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setDebouncedQuery(''); }}>
              <Ionicons name="close-circle" size={18} color={Colors.purpleMid} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Sort chips */}
      {hasResults && (
        <View style={styles.sortRow}>
          <FlatList
            horizontal
            data={SORT_OPTIONS}
            keyExtractor={(s) => s.value}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setActiveSort(item.value)}
                style={[styles.chip, activeSort === item.value && styles.chipActive]}
              >
                <Text style={[styles.chipText, activeSort === item.value && styles.chipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Loading */}
      {isSearching && (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>جاري البحث...</Text>
        </View>
      )}

      {/* No query — show categories */}
      {!debouncedQuery && !isSearching && (
        <View style={{ flex: 1 }}>
          <Text style={styles.browseTitle}>تصفح الأقسام</Text>
          <FlatList
            data={categories}
            keyExtractor={(c) => c.id}
            numColumns={3}
            contentContainerStyle={styles.catGrid}
            columnWrapperStyle={styles.catRow}
            renderItem={({ item: cat, index }) => (
              <CategoryCard
                category={cat}
                onPress={() => router.push(`/category/${cat.id}`)}
                index={index}
                size="md"
              />
            )}
          />
        </View>
      )}

      {/* Results */}
      {hasResults && !isSearching && (
        <FlatList
          data={results.services}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.resultCount}>
              {results.total} نتيجة لـ "{debouncedQuery}"
            </Text>
          }
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="لا توجد نتائج"
              subtitle="جرب كلمات بحث مختلفة أو تصفح الأقسام"
            />
          }
          renderItem={({ item }) => (
            <ServiceCard
              service={item}
              onPress={() => router.push(`/service/${item.id}`)}
              variant="list"
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchRow: { padding: 16, paddingBottom: 8 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  input: {
    flex: 1,
    fontFamily: 'Cairo_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  sortRow: { marginBottom: 8 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: Colors.lightPurple,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontFamily: 'Cairo_600SemiBold', fontSize: 12, color: Colors.purpleMid },
  chipTextActive: { color: '#fff' },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontFamily: 'Cairo_400Regular', fontSize: 14, color: Colors.textMuted },
  browseTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    color: Colors.textPrimary,
    paddingHorizontal: 16,
    marginBottom: 16,
    textAlign: 'right',
  },
  catGrid: { paddingHorizontal: 16, paddingBottom: 100 },
  catRow: { justifyContent: 'space-around', marginBottom: 20 },
  resultsList: { paddingHorizontal: 16, paddingBottom: 100 },
  resultCount: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'right',
    marginBottom: 12,
  },
});
