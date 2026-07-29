import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList,
  TouchableOpacity, ActivityIndicator, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../../src/constants/colors';
import { ServiceCard } from '../../src/components/common/ServiceCard';
import { CategoryCard } from '../../src/components/common/CategoryCard';
import { EmptyState } from '../../src/components/common/EmptyState';
import { search, manualSearch } from '../../src/api/search';
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
  const [isAiMode, setIsAiMode] = useState(true);
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories });

  const { data: results, isLoading, isFetching, isError: searchError } = useQuery({
    queryKey: ['search', debouncedQuery, activeSort, isAiMode],
    queryFn: () =>
      isAiMode
        ? search(debouncedQuery, { sort: activeSort, limit: 20 })
        : manualSearch(debouncedQuery, { sort: activeSort, limit: 20 }),
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
            placeholder={isAiMode ? 'ابحث بذكاء... (يفهم النية)' : 'ابحث عن خدمات، أقسام...'}
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

      {/* AI / Manual Switch */}
      <View style={styles.switchRow}>
        <Switch
          value={isAiMode}
          onValueChange={setIsAiMode}
          thumbColor={isAiMode ? Colors.primary : Colors.textLight}
          trackColor={{ false: Colors.border, true: `${Colors.primary}55` }}
        />
        <View style={styles.switchLabel}>
          <Ionicons
            name={isAiMode ? 'sparkles' : 'text-outline'}
            size={14}
            color={isAiMode ? Colors.primary : Colors.textMuted}
          />
          <Text style={[styles.switchText, isAiMode && styles.switchTextActive]}>
            {isAiMode ? 'بحث ذكي (AI)' : 'بحث يدوي عادي'}
          </Text>
        </View>
      </View>

      {/* Sort chips */}
      {hasResults && (
        <View style={styles.sortRow}>
          <FlatList keyboardShouldPersistTaps="handled"
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
          <Text style={styles.loadingText}>
            {isAiMode ? 'البحث الذكي جارٍ...' : 'جاري البحث...'}
          </Text>
        </View>
      )}

      {/* Results */}
      {!isSearching && searchError && debouncedQuery.length > 1 && (
        <View style={styles.loadingCenter}>
          <Ionicons name="wifi-outline" size={40} color={Colors.textMuted} />
          <Text style={styles.loadingText}>تعذّر البحث — تحقق من اتصالك وحاول مجدداً</Text>
        </View>
      )}

      {!isSearching && !searchError && hasResults && (
        <>
          {results!.services.length === 0 ? (
            <EmptyState
              icon="search-outline"
              title="لا توجد نتائج"
              subtitle={`لم نجد خدمات تطابق "${debouncedQuery}"`}
            />
          ) : (
            <FlatList keyboardShouldPersistTaps="handled"
              data={results!.services}
              keyExtractor={(s) => s.id}
              contentContainerStyle={styles.resultsList}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <Text style={styles.resultCount}>
                  {results!.total} نتيجة {isAiMode ? '(بحث ذكي)' : ''}
                </Text>
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
        </>
      )}

      {/* Browse categories when no query */}
      {!isSearching && !hasResults && (
        <>
          <Text style={styles.browseTitle}>تصفح الأقسام</Text>
          <FlatList keyboardShouldPersistTaps="handled"
            data={categories}
            keyExtractor={(c) => c.id}
            numColumns={3}
            columnWrapperStyle={styles.catRow}
            contentContainerStyle={styles.catGrid}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <CategoryCard
                category={item}
                onPress={() => router.push(`/category/${item.id}`)}
              />
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchRow: { paddingHorizontal: 16, paddingVertical: 12 },
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
    justifyContent: 'flex-end',
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  switchText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: Colors.textMuted,
  },
  switchTextActive: {
    color: Colors.primary,
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
