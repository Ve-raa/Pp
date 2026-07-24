import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  FlatList, RefreshControl, Dimensions, Image, TextInput, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../../src/constants/colors';
import { ServiceCard } from '../../src/components/common/ServiceCard';
import { CategoryCard } from '../../src/components/common/CategoryCard';
import { HomeLoadingSkeleton } from '../../src/components/common/LoadingState';
import { useAuthStore } from '../../src/store/authStore';
import { getHomePageData } from '../../src/api/home';
import { getCategories } from '../../src/api/categories';

const { width: W } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { buyerUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'featured' | 'popular' | 'new'>('featured');
  const [refreshing, setRefreshing] = useState(false);

  const { data: homeData, isLoading: homeLoading, refetch } = useQuery({
    queryKey: ['home'],
    queryFn: getHomePageData,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const services = activeTab === 'featured'
    ? homeData?.featuredServices
    : activeTab === 'popular'
    ? homeData?.popularServices
    : homeData?.recentServices;

  if (homeLoading && !refreshing) return <HomeLoadingSkeleton />;

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0) }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* App Bar */}
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color={Colors.purpleDark} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/wishlist')} style={styles.iconBtn}>
            <Ionicons name="heart-outline" size={22} color={Colors.purpleDark} />
          </TouchableOpacity>
        </View>
        <View style={styles.appBarRight}>
          <View>
            <Text style={styles.greeting}>مرحباً، {buyerUser?.name?.split(' ')[0] || 'عزيزي'} 👋</Text>
            <Text style={styles.subtitle}>ماذا تحتاج اليوم؟</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{buyerUser?.name?.[0] || 'V'}</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <TouchableOpacity
        onPress={() => router.push('/(buyer)/search')}
        style={styles.searchBar}
        activeOpacity={0.8}
      >
        <Ionicons name="search-outline" size={20} color={Colors.purpleMid} />
        <Text style={styles.searchPlaceholder}>ابحث عن خدمات...</Text>
        <Ionicons name="options-outline" size={20} color={Colors.primary} />
      </TouchableOpacity>

      {/* Banners */}
      {!!homeData?.banners?.length && (
        <FlatList
          data={homeData.banners}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.bannersContainer}
          renderItem={({ item: banner }) => (
            <TouchableOpacity activeOpacity={0.9} style={[styles.banner, { width: W - 32 }]}>
              <Image
                source={{ uri: banner.image }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
              {banner.title && (
                <View style={styles.bannerOverlay}>
                  <Text style={styles.bannerTitle}>{banner.title}</Text>
                  {banner.subtitle && (
                    <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          )}
          style={styles.bannerList}
        />
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TouchableOpacity onPress={() => router.push('/category/all')}>
              <Text style={styles.seeAll}>عرض الكل</Text>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>الأقسام</Text>
          </View>
          <FlatList
            data={categories.slice(0, 8)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(c) => c.id}
            contentContainerStyle={styles.categoriesContainer}
            renderItem={({ item: cat, index }) => (
              <CategoryCard
                category={cat}
                onPress={() => router.push(`/category/${cat.id}`)}
                index={index}
              />
            )}
          />
        </View>
      )}

      {/* Services Tabs */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <TouchableOpacity>
            <Text style={styles.seeAll}>عرض الكل</Text>
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>الخدمات</Text>
        </View>

        <View style={styles.tabs}>
          {(['featured', 'popular', 'new'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'featured' ? 'مميزة' : tab === 'popular' ? 'الأكثر طلباً' : 'جديدة'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {services && services.length > 0 ? (
          <View style={styles.grid}>
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onPress={() => router.push(`/service/${service.id}`)}
                variant="grid"
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyServices}>
            <Ionicons name="cube-outline" size={40} color={Colors.primaryLight} />
            <Text style={styles.emptyText}>لا توجد خدمات متاحة</Text>
          </View>
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  appBarRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  appBarLeft: { flexDirection: 'row', gap: 4 },
  greeting: { fontFamily: 'Cairo_700Bold', fontSize: 18, color: Colors.textPrimary, textAlign: 'right' },
  subtitle: { fontFamily: 'Cairo_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'right' },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: 'Cairo_700Bold', fontSize: 18, color: '#fff' },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lightPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: Colors.shadowColorDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchPlaceholder: { flex: 1, fontFamily: 'Cairo_400Regular', fontSize: 14, color: Colors.textMuted, textAlign: 'right' },
  bannersContainer: { paddingHorizontal: 16, gap: 12 },
  bannerList: { marginBottom: 8 },
  banner: {
    height: 170,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: Colors.lightPurple,
    marginLeft: 8,
  },
  bannerImage: { width: '100%', height: '100%' },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    backgroundColor: 'rgba(26,22,37,0.5)',
  },
  bannerTitle: { fontFamily: 'Cairo_700Bold', fontSize: 16, color: '#fff', textAlign: 'right' },
  bannerSubtitle: { fontFamily: 'Cairo_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.8)', textAlign: 'right' },
  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontFamily: 'Cairo_700Bold', fontSize: 17, color: Colors.textPrimary },
  seeAll: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: Colors.primary },
  categoriesContainer: { paddingHorizontal: 16 },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 14,
  },
  tab: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.lightPurple,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: Colors.purpleMid },
  tabTextActive: { color: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12 },
  emptyServices: { alignItems: 'center', padding: 40, gap: 12 },
  emptyText: { fontFamily: 'Cairo_400Regular', fontSize: 14, color: Colors.textMuted },
});
