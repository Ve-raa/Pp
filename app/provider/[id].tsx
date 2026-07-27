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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { publicGet, buyerPost } from '../../src/api/client';
import { Colors } from '../../src/constants/colors';
import { ServiceCard } from '../../src/components/common/ServiceCard';
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
  const data = await publicGet<any>(`/api/providers/${id}`);
  const p = data?.provider ?? data;
  return {
    id: String(p.id),
    name: p.name ?? '',
    avatar: fullUrl(p.avatar ?? p.logo_url),
    coverImage: fullUrl(p.cover_image ?? p.cover),
    bio: p.bio ?? p.description,
    rating: Number(p.rating ?? 0),
    reviewsCount: p.reviewsCount ?? p.review_count ?? 0,
    city: p.city,
    isVerified: p.verified ?? p.isVerified ?? false,
    followersCount: p.followersCount ?? p.followers ?? 0,
    viewsCount: p.viewsCount ?? p.views ?? 0,
    completedOrders: p.completedOrders ?? p.completed_orders ?? 0,
    servicesCount: p.servicesCount ?? p.services_count ?? 0,
    category: p.category ?? p.specialty,
    services: (p.services ?? []).map((s: any): Service => ({
      id: String(s.id),
      title: s.title ?? s.name ?? '',
      price: Number(s.price ?? 0),
      currency: s.currency ?? 'AED',
      images: s.image_url ? [fullUrl(s.image_url) as string] : [],
      image: fullUrl(s.image_url ?? s.image),
      rating: Number(s.rating ?? 0),
      reviewsCount: s.review_count ?? 0,
      isAvailable: s.is_active ?? true,
    })),
  };
}

export default function ProviderProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const handleFollowToggle = async () => {
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

  const { data: provider, isLoading } = useQuery({
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

  if (!provider) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>تعذّر تحميل بيانات التاجر</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backFallback}>
          <Text style={styles.backFallbackText}>رجوع</Text>
        </TouchableOpacity>
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
      {/* Cover */}
      <View style={styles.coverWrapper}>
        {provider.coverImage ? (
          <Image
            source={{ uri: provider.coverImage }}
            style={[styles.cover, { height: 180 + insets.top }]}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.coverFallback,
              { height: 180 + insets.top, paddingTop: insets.top },
            ]}
          />
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

          {provider.category && (
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

  // Cover
  coverWrapper: { position: 'relative' },
  cover: { width: '100%', backgroundColor: Colors.lightPurple },
  coverFallback: { width: '100%', backgroundColor: Colors.primary },
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
});
