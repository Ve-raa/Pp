import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { publicGet, buyerPost } from '../../src/api/client';
import { Colors } from '../../src/constants/colors';
import { ServiceCard } from '../../src/components/common/ServiceCard';
import { useAuthStore } from '../../src/store/authStore';
import type { Service, ServiceProvider } from '../../src/types';

const { width: W } = Dimensions.get('window');
const BASE = 'https://veraapp.app';
function fullUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  return path.startsWith('http') ? path : `${BASE}${path}`;
}

interface ProviderProfile {
  id: string;
  name: string;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  rating?: number;
  reviewsCount?: number;
  city?: string;
  isVerified?: boolean;
  followersCount?: number;
  viewsCount?: number;
  completedOrders?: number;
  servicesCount?: number;
  category?: string;
  services?: Service[];
}

async function getProviderProfile(id: string): Promise<ProviderProfile> {
  // Try multiple endpoint paths — the API may be on any of these routes
  const ENDPOINTS = [
    `/api/public/providers/${encodeURIComponent(id)}`,
    `/api/public/merchants/${encodeURIComponent(id)}`,
    `/api/providers/${encodeURIComponent(id)}`,
    `/api/merchants/${encodeURIComponent(id)}`,
  ];

  let data: any = null;
  let lastError: unknown = null;
  for (const endpoint of ENDPOINTS) {
    try {
      data = await publicGet<any>(endpoint);
      if (data && (data.provider || data.id || data.name)) break;
    } catch (err) {
      lastError = err;
    }
  }
  if (!data) throw lastError ?? new Error('تعذّر تحميل بيانات التاجر');

  const p = data?.provider ?? data;
  return {
    id: String(p.id),
    name: p.name ?? '',
    avatar: fullUrl(p.avatar ?? p.logo_url),
    coverImage: fullUrl(
      p.cover_image ?? p.coverImage ?? p.cover ?? p.banner_image ?? p.banner ?? p.header_image ?? p.profile_cover
    ),
    bio: p.bio ?? p.description,
    rating: Number(p.rating ?? 0),
    reviewsCount: p.reviewsCount ?? p.review_count ?? 0,
    city: p.city,
    isVerified: p.verified ?? p.isVerified ?? false,
    followersCount: p.followersCount ?? p.followerCount ?? p.followers ?? 0,
    viewsCount: p.viewsCount ?? p.totalViews ?? p.views ?? 0,
    completedOrders: p.completedOrders ?? p.completed_orders ?? 0,
    servicesCount: p.servicesCount ?? p.serviceCount ?? p.services_count ?? 0,
    category: p.category ?? p.specialty,
    services: (data?.services ?? p.services ?? []).map((s: any): Service => ({
      id: String(s.id),
      title: s.title ?? s.name ?? '',
      price: Number(s.price ?? 0),
      currency: s.currency ?? 'AED',
      images: s.image_url || s.image ? [fullUrl(s.image_url ?? s.image) as string] : [],
      image: fullUrl(s.image_url ?? s.image),
      rating: Number(s.rating ?? 0),
      reviewsCount: s.review_count ?? s.reviewCount ?? 0,
      isAvailable: s.is_active ?? s.isActive ?? true,
      categoryId: s.category_id ? String(s.category_id) : undefined,
      subcategory: s.subcategory,
    })),
  };
}

export default function ProviderProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Retrieve auth state to guard follow action
  const { buyerToken } = useAuthStore();

  const handleFollowToggle = async () => {
    if (!buyerToken) {
      setShowLoginModal(true);
      return;
    }
    if (followLoading || !id) return;
    const newVal = !following;
    setFollowing(newVal); // optimistic update
    setFollowLoading(true);
    try {
      await buyerPost(`/api/providers/${id}/${newVal ? 'follow' : 'unfollow'}`, {});
    } catch {
      // الخادم لا يدعم هذا المسار بعد — نحتفظ بالحالة المحلية
    } finally {
      setFollowLoading(false);
    }
  };

  const { data: provider, isLoading, isError, refetch } = useQuery({
    queryKey: ['provider', id],
    queryFn: () => getProviderProfile(id!),
    enabled: !!id,
  });

  const initials = (provider?.name ?? 'V')
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0] ?? '')
    .join('')
    .toUpperCase();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (isError || !provider) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="cloud-offline-outline" size={42} color={Colors.primary} />
        <Text style={styles.errorText}>
          {isError ? 'تعذّر تحميل بيانات التاجر. تحقق من الاتصال وحاول مرة أخرى.' : 'لم يتم العثور على بيانات التاجر.'}
        </Text>
        <View style={styles.errorActions}>
          {isError && (
            <TouchableOpacity onPress={() => refetch()} style={styles.backFallback}>
              <Text style={styles.backFallbackText}>إعادة المحاولة</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => router.back()} style={styles.backFallbackSecondary}>
            <Text style={styles.backFallbackSecondaryText}>رجوع</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const stats = [
    { icon: 'people-outline', value: String(provider.followersCount ?? 0), label: 'متابع' },
    { icon: 'eye-outline',    value: String(provider.viewsCount ?? 0),     label: 'مشاهدة' },
    { icon: 'checkmark-circle-outline', value: String(provider.completedOrders ?? 0), label: 'طلب مكتمل' },
    { icon: 'grid-outline',   value: String(provider.servicesCount ?? 0),  label: 'خدمة' },
  ];

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      {/* Custom login modal — same design as service detail */}
      <Modal
        visible={showLoginModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowLoginModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowLoginModal(false)}>
          <Pressable style={styles.modalBox} onPress={() => {}}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="lock-closed-outline" size={36} color={Colors.primary} />
            </View>
            <Text style={styles.modalBrand}>VÉRA</Text>
            <Text style={styles.modalTitle}>تسجيل الدخول مطلوب</Text>
            <Text style={styles.modalSubtitle}>
              سجّل دخولك لمتابعة التاجر والاستمتاع بجميع المميزات
            </Text>
            <TouchableOpacity
              style={styles.modalLoginBtn}
              activeOpacity={0.85}
              onPress={() => {
                setShowLoginModal(false);
                router.push('/(auth)/login');
              }}
            >
              <Text style={styles.modalLoginBtnText}>تسجيل الدخول</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              activeOpacity={0.7}
              onPress={() => setShowLoginModal(false)}
            >
              <Text style={styles.modalCancelBtnText}>إلغاء</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Cover */}
      <View style={styles.coverWrapper}>
        {provider.coverImage ? (
          <Image
            source={{ uri: provider.coverImage }}
            style={[styles.cover, { height: 180 + insets.top }]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.coverFallback, { height: 180 + insets.top }]} />
        )}
        {/* Back button */}
        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + 12 }]}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-forward" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Card */}
        <View style={styles.headerCard}>
          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            {provider.avatar ? (
              <Image
                source={{ uri: provider.avatar }}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            {provider.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
              </View>
            )}
          </View>

          <Text style={styles.name}>{provider.name}</Text>

          {provider.category && provider.category.trim() !== provider.name.trim() && (
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{provider.category}</Text>
            </View>
          )}

          {provider.city && (
            <View style={styles.cityRow}>
              <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
              <Text style={styles.city}>{provider.city}</Text>
            </View>
          )}

          {/* Rating */}
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.rating}>{provider.rating?.toFixed(1) ?? '0.0'}</Text>
            {(provider.reviewsCount ?? 0) > 0 && (
              <Text style={styles.ratingCount}>
                ({provider.reviewsCount} تقييم)
              </Text>
            )}
          </View>

          {/* Follow button */}
          <TouchableOpacity
            style={[styles.followBtn, following && styles.followBtnActive]}
            onPress={handleFollowToggle}
            activeOpacity={0.82}
            disabled={followLoading}
          >
            <Ionicons
              name={following ? 'heart' : 'heart-outline'}
              size={16}
              color={following ? '#fff' : Colors.primary}
            />
            <Text style={[styles.followBtnText, following && styles.followBtnTextActive]}>
              {following ? 'متابَع' : 'متابعة'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {stats.map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Ionicons name={s.icon as any} size={18} color={Colors.primary} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Bio */}
        {provider.bio ? (
          <View style={styles.bioSection}>
            <Text style={styles.sectionTitle}>نبذة عن التاجر</Text>
            <Text style={styles.bio}>{provider.bio}</Text>
          </View>
        ) : null}

        {/* Services */}
        {(provider.services?.length ?? 0) > 0 && (
          <View style={styles.servicesSection}>
            <Text style={styles.sectionTitle}>خدمات التاجر</Text>
            <View style={styles.servicesGrid}>
              {(provider.services ?? []).map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onPress={() => router.push(`/service/${service.id}`)}
                  variant="grid"
                />
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  errorText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  backFallback: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backFallbackText: { fontFamily: 'Cairo_700Bold', fontSize: 14, color: '#fff' },
  errorActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  backFallbackSecondary: {
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backFallbackSecondaryText: { fontFamily: 'Cairo_700Bold', fontSize: 14, color: Colors.primary },

  // Cover
  coverWrapper: { position: 'relative' },
  cover: { width: '100%', backgroundColor: Colors.lightPurple },
  coverFallback: { width: '100%', backgroundColor: Colors.purpleDark },
  coverFallbackName: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    maxWidth: 200,
    textAlign: 'center',
  },
  backBtn: {
    position: 'absolute',
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
  },

  scrollContent: { paddingHorizontal: 16 },

  // Header card
  headerCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 20,
    marginTop: -40,
    padding: 20,
    alignItems: 'center',
    shadowColor: Colors.shadowColorDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.lightPurple,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.primaryLight,
  },
  avatarInitials: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 30,
    color: '#fff',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    padding: 1,
  },
  name: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 20,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  categoryTag: {
    backgroundColor: Colors.lightPurple,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
    color: Colors.primary,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  city: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  rating: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 15,
    color: Colors.purpleDark,
  },
  ratingCount: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },

  // Follow button
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 9,
  },
  followBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  followBtnText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    color: Colors.primary,
  },
  followBtnTextActive: { color: '#fff' },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadowColorDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
  },

  // Bio
  bioSection: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    color: Colors.textPrimary,
    textAlign: 'right',
    marginBottom: 10,
  },
  bio: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'right',
    lineHeight: 24,
  },

  // Services
  servicesSection: { marginBottom: 16 },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: Colors.cardBg,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  modalIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.lightPurple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalBrand: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 22,
    color: Colors.primary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  modalTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalLoginBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalLoginBtnText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 15,
    color: '#fff',
  },
  modalCancelBtn: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: Colors.textMuted,
  },
});
