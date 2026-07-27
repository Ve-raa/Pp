import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../../src/constants/colors';
import { ServiceCard } from '../../src/components/common/ServiceCard';
import { CategoryCard } from '../../src/components/common/CategoryCard';
import { ProviderCard } from '../../src/components/common/ProviderCard';
import { HomeLoadingSkeleton } from '../../src/components/common/LoadingState';
import { useAuthStore } from '../../src/store/authStore';
import { getHomePageData } from '../../src/api/home';
import { getCategories } from '../../src/api/categories';
import { getAllSectionBanners } from '../../src/api/sectionBanners';
import { Linking } from 'react-native';
import type { SectionBanner, HomeSectionKey, Service, ServiceProvider } from '../../src/types';

const { width: W } = Dimensions.get('window');
const SLIDER_CARD_WIDTH = 200;

// ─── Section Banner Strip ──────────────────────────────────────────────────────
interface SectionBannerStripProps {
  banners: SectionBanner[];
}
function SectionBannerStrip({ banners }: SectionBannerStripProps) {
  const router = useRouter();
  if (!banners.length) return null;

  const handleBannerPress = (link?: string) => {
    if (!link) return;
    try {
      if (link.startsWith('http://') || link.startsWith('https://')) {
        Linking.openURL(link).catch(() => {});
      } else {
        router.push(link as any);
      }
    } catch { /* ignore */ }
  };

  return (
    <FlatList
      data={banners}
      horizontal
      pagingEnabled={banners.length > 1}
      showsHorizontalScrollIndicator={false}
      keyExtractor={(b) => b.id}
      style={styles.sectionBannerList}
      contentContainerStyle={styles.sectionBannerContent}
      renderItem={({ item }) => (
        <TouchableOpacity
          activeOpacity={item.link ? 0.8 : 1}
          style={[styles.sectionBanner, { width: W - 32 }]}
          onPress={() => handleBannerPress(item.link)}
          disabled={!item.link}
        >
          <Image
            source={{ uri: item.image }}
            style={styles.sectionBannerImg}
            resizeMode="cover"
          />
          {item.title && (
            <View style={styles.sectionBannerOverlay}>
              <Text style={styles.sectionBannerTitle}>{item.title}</Text>
            </View>
          )}
          {item.link && (
            <View style={styles.sectionBannerLinkBadge}>
              <Text style={styles.sectionBannerLinkText}>اضغط للمزيد ←</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    />
  );
}

// ─── Horizontal Service Slider ─────────────────────────────────────────────────
interface ServiceSliderProps {
  title: string;
  services: Service[];
  onSeeAll?: () => void;
  sectionBanners: SectionBanner[];
  onServicePress: (id: string) => void;
}
function ServiceSlider({
  title,
  services,
  onSeeAll,
  sectionBanners,
  onServicePress,
}: ServiceSliderProps) {
  if (!services.length) return null;
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll}>
            <Text style={styles.seeAll}>عرض الكل</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <SectionBannerStrip banners={sectionBanners} />
      <FlatList
        data={services}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.sliderContent}
        renderItem={({ item }) => (
          <ServiceCard
            service={item}
            onPress={() => onServicePress(item.id)}
            variant="featured"
            style={styles.sliderCard}
          />
        )}
      />
    </View>
  );
}

// ─── Top Providers Slider ──────────────────────────────────────────────────────
interface ProviderSliderProps {
  providers: ServiceProvider[];
  sectionBanners: SectionBanner[];
  onProviderPress: (id: string) => void;
}
function ProviderSlider({ providers, sectionBanners, onProviderPress }: ProviderSliderProps) {
  if (!providers.length) return null;
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View />
        <View>
          <Text style={styles.sectionTitle}>أبرز التجار</Text>
          <Text style={styles.sectionSubtitle}>تجار موثوقون بتقييمات عالية</Text>
        </View>
      </View>
      <SectionBannerStrip banners={sectionBanners} />
      <FlatList
        data={providers}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.sliderContent}
        renderItem={({ item }) => (
          <ProviderCard
            provider={item}
            onPress={() => onProviderPress(item.id)}
          />
        )}
      />
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { buyerUser } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [sectionBanners, setSectionBanners] = useState<SectionBanner[]>([]);

  const { data: homeData, isLoading: homeLoading, refetch } = useQuery({
    queryKey: ['home'],
    queryFn: getHomePageData,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const loadSectionBanners = useCallback(async () => {
    try {
      const all = await getAllSectionBanners();
      setSectionBanners(all);
    } catch {
      // non-critical — silently ignore
    }
  }, []);

  useEffect(() => {
    loadSectionBanners();
  }, [loadSectionBanners]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), loadSectionBanners()]);
    setRefreshing(false);
  }, [refetch, loadSectionBanners]);

  const bannersFor = (key: HomeSectionKey) =>
    sectionBanners.filter((b) => b.sectionKey === key);

  if (homeLoading && !refreshing) return <HomeLoadingSkeleton />;

  return (
    <ScrollView
      style={[
        styles.container,
        { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0) },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.primary}
        />
      }
    >
      {/* ── App Bar ─────────────────────────────────────────────────── */}
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <TouchableOpacity
            onPress={() => router.push('/notifications')}
            style={styles.iconBtn}
          >
            <Ionicons name="notifications-outline" size={22} color={Colors.purpleDark} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/wishlist')}
            style={styles.iconBtn}
          >
            <Ionicons name="heart-outline" size={22} color={Colors.purpleDark} />
          </TouchableOpacity>
        </View>
        <View style={styles.appBarRight}>
          <View>
            <Text style={styles.greeting}>
              مرحباً، {buyerUser?.name?.split(' ')[0] || 'عزيزي'} 👋
            </Text>
            <Text style={styles.subtitle}>ماذا تحتاج اليوم؟</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {buyerUser?.name?.[0] || 'V'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Search Bar ──────────────────────────────────────────────── */}
      <TouchableOpacity
        onPress={() => router.push('/(buyer)/search')}
        style={styles.searchBar}
        activeOpacity={0.8}
      >
        <Ionicons name="search-outline" size={20} color={Colors.purpleMid} />
        <Text style={styles.searchPlaceholder}>ابحث عن خدمات...</Text>
        <Ionicons name="options-outline" size={20} color={Colors.primary} />
      </TouchableOpacity>

      {/* ── Main Banners ─────────────────────────────────────────────── */}
      {!!homeData?.banners?.length && (
        <FlatList
          data={homeData.banners}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.bannersContainer}
          style={styles.bannerList}
          renderItem={({ item: banner }) => (
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.banner, { width: W - 32 }]}
            >
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
        />
      )}

      {/* ── Categories ──────────────────────────────────────────────── */}
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

      {/* ── Featured Services Slider ─────────────────────────────────── */}
      <ServiceSlider
        title="الخدمات المميزة"
        services={homeData?.featuredServices ?? []}
        sectionBanners={bannersFor('featured')}
        onSeeAll={() => router.push('/(buyer)/search')}
        onServicePress={(id) => router.push(`/service/${id}`)}
      />

      {/* ── Popular (Most Viewed) Slider ─────────────────────────────── */}
      <ServiceSlider
        title="الأكثر مشاهدة"
        services={homeData?.popularServices ?? []}
        sectionBanners={bannersFor('popular')}
        onSeeAll={() => router.push('/(buyer)/search')}
        onServicePress={(id) => router.push(`/service/${id}`)}
      />

      {/* ── Best Sellers Slider ──────────────────────────────────────── */}
      <ServiceSlider
        title="الأكثر مبيعاً"
        services={homeData?.bestSellingServices ?? homeData?.recentServices ?? []}
        sectionBanners={bannersFor('best_sellers')}
        onSeeAll={() => router.push('/(buyer)/search')}
        onServicePress={(id) => router.push(`/service/${id}`)}
      />

      {/* ── Top Providers Slider ─────────────────────────────────────── */}
      <ProviderSlider
        providers={homeData?.topProviders ?? []}
        sectionBanners={bannersFor('top_providers')}
        onProviderPress={(id) => router.push(`/provider/${id}`)}
      />

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // App Bar
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  appBarRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  appBarLeft: { flexDirection: 'row', gap: 4 },
  greeting: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  subtitle: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'right',
  },
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

  // Search Bar
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
  searchPlaceholder: {
    flex: 1,
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'right',
  },

  // Main Banners
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
  bannerTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    color: '#fff',
    textAlign: 'right',
  },
  bannerSubtitle: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'right',
  },

  // Sections
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 17,
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  sectionSubtitle: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: 2,
  },
  seeAll: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: Colors.primary,
  },

  // Section Banners
  sectionBannerList: { marginBottom: 12 },
  sectionBannerContent: { paddingHorizontal: 16, gap: 8 },
  sectionBanner: {
    height: 100,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: Colors.lightPurple,
    marginLeft: 8,
  },
  sectionBannerImg: { width: '100%', height: '100%' },
  sectionBannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(26,22,37,0.45)',
  },
  sectionBannerLinkBadge: {
    position: 'absolute',
    top: 8,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sectionBannerLinkText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 10,
    color: '#fff',
  },
  sectionBannerTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
    color: '#fff',
    textAlign: 'right',
  },

  // Categories
  categoriesContainer: { paddingHorizontal: 16 },

  // Sliders
  sliderContent: { paddingHorizontal: 16, paddingRight: 24 },
  sliderCard: { marginLeft: 0, marginRight: 12 },
});
