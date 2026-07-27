import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, ScrollView,
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

// أيقونات افتراضية للتصنيفات الفرعية (تُختار حسب الكلمة المفتاحية)
function guessIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('تنظيف') || n.includes('cleaning')) return 'sparkles-outline';
  if (n.includes('توصيل') || n.includes('delivery')) return 'bicycle-outline';
  if (n.includes('طعام') || n.includes('food') || n.includes('مطبخ')) return 'restaurant-outline';
  if (n.includes('صيانة') || n.includes('repair') || n.includes('تصليح')) return 'build-outline';
  if (n.includes('تصوير') || n.includes('photo') || n.includes('camera')) return 'camera-outline';
  if (n.includes('تصميم') || n.includes('design')) return 'color-palette-outline';
  if (n.includes('برمجة') || n.includes('code') || n.includes('تقنية')) return 'code-slash-outline';
  if (n.includes('تعليم') || n.includes('تدريس') || n.includes('education')) return 'school-outline';
  if (n.includes('طب') || n.includes('صحة') || n.includes('health')) return 'medical-outline';
  if (n.includes('رياضة') || n.includes('sport') || n.includes('لياقة')) return 'fitness-outline';
  if (n.includes('سفر') || n.includes('travel') || n.includes('سياحة')) return 'airplane-outline';
  if (n.includes('جمال') || n.includes('beauty') || n.includes('حلاقة')) return 'cut-outline';
  if (n.includes('حيوان') || n.includes('pet')) return 'paw-outline';
  if (n.includes('نقل') || n.includes('شحن') || n.includes('moving')) return 'car-outline';
  if (n.includes('حراسة') || n.includes('security')) return 'shield-outline';
  return 'grid-outline';
}

const SORT_OPTIONS = [
  { label: 'الأحدث', value: 'newest' },
  { label: 'الأعلى تقييماً', value: 'rating' },
  { label: 'الأرخص', value: 'price_asc' },
  { label: 'الأغلى', value: 'price_desc' },
];

// Bug 3 fix: ألوان أفتح وأخف للبطاقات مع الحفاظ على وضوح النص الأبيض
const SUBCAT_COLORS = [
  '#818cf8', // indigo فاتح (بدلاً من #6366f1 الداكن)
  '#7c6fa8', // بنفسجي فاتح (بدلاً من #4A3F6B الداكن جداً)
  '#9b8bcf', // بنفسجي متوسط فاتح (بدلاً من #6C5AA8)
  '#a07ed4', // بنفسجي فاتح (بدلاً من #7C5CBF)
  '#7ba8f7', // أزرق فاتح (بدلاً من #5B8AF5)
  '#e88fa0', // وردي فاتح (بدلاً من #E0667A)
  '#6fc4a3', // أخضر فاتح (بدلاً من #4CAF88)
  '#f0a86a', // برتقالي فاتح (بدلاً من #E08B44)
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

  // تحميل نطاق واسع لاستخراج كل التصنيفات الفرعية
  const { data, isLoading } = useQuery({
    queryKey: ['category-services', id, sort],
    queryFn: () => getServicesByCategory(id!, { sort, limit: 100 }),
    enabled: !!id,
  });

  // استخراج التصنيفات الفرعية الفريدة مع عدد خدماتها
  const subcategories = useMemo(() => {
    if (!data?.services?.length) return [];
    const countMap = new Map<string, number>();
    for (const s of data.services) {
      if (s.subcategory) {
        countMap.set(s.subcategory, (countMap.get(s.subcategory) ?? 0) + 1);
      }
    }
    return Array.from(countMap.entries()).map(([name, count]) => ({ name, count }));
  }, [data]);

  // خدمات مفلترة حسب التصنيف الفرعي
  const filteredServices = useMemo(() => {
    if (!data?.services) return [];
    if (!selectedSubcat) return data.services;
    return data.services.filter((s) => s.subcategory === selectedSubcat);
  }, [data, selectedSubcat]);

  // ─── حالة التحميل ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Header title={category?.name || 'تصفح الخدمات'} showBack />
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </View>
    );
  }

  // ─── صفحة وسيطة: التصنيفات الفرعية كأيقونات ─────────────────────────────
  if (!selectedSubcat) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Header title={category?.name || 'تصفح الخدمات'} showBack />

        <ScrollView
          contentContainerStyle={styles.subcatGrid}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.subcatTitle}>اختر تصنيفاً</Text>

          {/* زر "الكل" يعرض جميع الخدمات */}
          {/* Bug 3 fix: استخدام لون أفتح لبطاقة "جميع الخدمات" */}
          <TouchableOpacity
            style={[styles.subcatCard, { backgroundColor: '#818cf8' }]}
            onPress={() => setSelectedSubcat('__all__')}
            activeOpacity={0.8}
          >
            <View style={styles.subcatIconBox}>
              <Ionicons name="apps-outline" size={32} color="#fff" />
            </View>
            <Text style={styles.subcatName}>جميع الخدمات</Text>
            <Text style={styles.subcatCount}>{data?.services.length ?? 0} خدمة</Text>
          </TouchableOpacity>

          {subcategories.map(({ name, count }, i) => (
            <TouchableOpacity
              key={name}
              style={[
                styles.subcatCard,
                { backgroundColor: SUBCAT_COLORS[i % SUBCAT_COLORS.length] },
              ]}
              onPress={() => setSelectedSubcat(name)}
              activeOpacity={0.8}
            >
              <View style={styles.subcatIconBox}>
                <Ionicons name={guessIcon(name) as any} size={32} color="#fff" />
              </View>
              <Text style={styles.subcatName}>{name}</Text>
              <Text style={styles.subcatCount}>{count} خدمة</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  // ─── قائمة الخدمات (بعد اختيار التصنيف الفرعي أو إن لم تكن هناك تصنيفات) ──
  const displayServices = selectedSubcat === '__all__' ? (data?.services ?? []) : filteredServices;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title={selectedSubcat && selectedSubcat !== '__all__' ? selectedSubcat : (category?.name || 'تصفح الخدمات')}
        showBack
        onBack={() => setSelectedSubcat(null)}
      />

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

      {!displayServices.length ? (
        <EmptyState
          icon="cube-outline"
          title="لا توجد خدمات"
          subtitle="لا توجد خدمات في هذا القسم حالياً"
        />
      ) : (
        <FlatList
          data={displayServices}
          keyExtractor={(s) => s.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.count}>{displayServices.length} خدمة</Text>
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
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // ── Subcategory intermediate page ────────────────────────────────────────────
  subcatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 80,
    gap: 12,
    justifyContent: 'space-between',
  },
  subcatTitle: {
    width: '100%',
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    color: Colors.textPrimary,
    textAlign: 'right',
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  subcatCard: {
    width: '47%',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  subcatIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  subcatName: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  subcatCount: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },

  // ── Services list ─────────────────────────────────────────────────────────────
  sortContainer: { paddingVertical: 10 },
  chip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: Colors.lightPurple, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontFamily: 'Cairo_600SemiBold', fontSize: 12, color: Colors.purpleMid },
  chipTextActive: { color: '#fff' },
  grid: { paddingHorizontal: 16, paddingBottom: 80 },
  gridRow: { gap: 12, marginBottom: 0 },
  count: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: Colors.textMuted, textAlign: 'right', marginBottom: 12 },
});
