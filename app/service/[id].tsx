import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  FlatList, Alert, ActivityIndicator, Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../src/constants/colors';
import { Button } from '../../src/components/common/Button';
import { Skeleton } from '../../src/components/common/LoadingState';
import { getServiceById, getServiceReviews, addToWishlist, removeFromWishlist } from '../../src/api/services';
import { useCartStore } from '../../src/store/cartStore';
import { useAuthStore } from '../../src/store/authStore';

const { width: W } = Dimensions.get('window');

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addItem } = useCartStore();
  const { buyerToken } = useAuthStore();
  const [wishlisted, setWishlisted] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const { data: service, isLoading } = useQuery({
    queryKey: ['service', id],
    queryFn: () => getServiceById(id!),
    enabled: !!id,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => getServiceReviews(id!, 1, 5),
    enabled: !!id,
  });

  const wishlistMutation = useMutation({
    mutationFn: () => wishlisted ? removeFromWishlist(id!) : addToWishlist(id!),
    onSuccess: () => {
      setWishlisted((v) => !v);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
  });

  const handleAddToCart = () => {
    if (!service) return;
    if (!buyerToken) {
      Alert.alert('تسجيل الدخول مطلوب', 'يجب تسجيل الدخول لإضافة الخدمة للسلة', [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'تسجيل الدخول', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }
    addItem(service, quantity);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('تمت الإضافة ✅', 'تمت إضافة الخدمة إلى سلتك', [
      { text: 'متابعة التسوق' },
      { text: 'عرض السلة', onPress: () => router.push('/(buyer)/cart') },
    ]);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.backBtn}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
            <Ionicons name="chevron-forward" size={24} color={Colors.purpleDark} />
          </TouchableOpacity>
        </View>
        <Skeleton height={300} borderRadius={0} />
        <View style={styles.loadingContent}>
          <Skeleton height={24} width="70%" style={{ marginBottom: 12, alignSelf: 'flex-end' }} />
          <Skeleton height={16} width="50%" style={{ marginBottom: 8, alignSelf: 'flex-end' }} />
          <Skeleton height={60} style={{ marginBottom: 8 }} />
        </View>
      </View>
    );
  }

  if (!service) return null;

  const images = service.images?.length ? service.images : service.image ? [service.image] : [];
  const discountPct = service.originalPrice
    ? Math.round(((service.originalPrice - service.price) / service.originalPrice) * 100)
    : 0;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 80 }]}>
      {/* Floating back / wishlist */}
      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => wishlistMutation.mutate()}
          style={[styles.floatBtn, wishlisted && styles.floatBtnActive]}
        >
          <Ionicons
            name={wishlisted ? 'heart' : 'heart-outline'}
            size={20}
            color={wishlisted ? Colors.accent : Colors.purpleDark}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={styles.floatBtn}>
          <Ionicons name="chevron-forward" size={24} color={Colors.purpleDark} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Images */}
        {images.length > 0 ? (
          <View>
            <FlatList
              data={images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => i.toString()}
              onMomentumScrollEnd={(e) =>
                setActiveImage(Math.round(e.nativeEvent.contentOffset.x / W))
              }
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={[styles.mainImage, { width: W }]} />
              )}
            />
            {images.length > 1 && (
              <View style={styles.imageDots}>
                {images.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.imageDot, i === activeImage && styles.imageDotActive]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.mainImage, styles.placeholderImage]}>
            <Ionicons name="image-outline" size={60} color={Colors.border} />
          </View>
        )}

        <View style={styles.content}>
          {/* Title & badges */}
          <View style={styles.titleRow}>
            {discountPct > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-{discountPct}%</Text>
              </View>
            )}
            <Text style={styles.title}>{service.title}</Text>
          </View>

          {/* Rating */}
          <View style={styles.metaRow}>
            <Text style={styles.reviewCount}>({service.reviewsCount || 0} تقييم)</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name="star"
                  size={14}
                  color={star <= Math.round(service.rating || 0) ? '#F59E0B' : Colors.border}
                />
              ))}
              <Text style={styles.ratingText}>{service.rating?.toFixed(1) || '0.0'}</Text>
            </View>
          </View>

          {/* Price */}
          <View style={styles.priceRow}>
            {service.originalPrice && (
              <Text style={styles.originalPrice}>{service.originalPrice} ر.س</Text>
            )}
            <Text style={styles.price}>{service.price} ر.س</Text>
          </View>

          {/* Provider */}
          {service.provider && (
            <View style={styles.providerCard}>
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{service.provider.name}</Text>
                {service.provider.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
                    <Text style={styles.verifiedText}>موثّق</Text>
                  </View>
                )}
              </View>
              <View style={styles.providerAvatar}>
                {service.provider.avatar ? (
                  <Image source={{ uri: service.provider.avatar }} style={styles.providerAvatarImg} />
                ) : (
                  <Text style={styles.providerAvatarText}>
                    {service.provider.name?.[0]?.toUpperCase()}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Description */}
          {service.description && (
            <View style={styles.descSection}>
              <Text style={styles.sectionTitle}>وصف الخدمة</Text>
              <Text style={styles.description}>{service.description}</Text>
            </View>
          )}

          {/* Details */}
          {service.deliveryTime && (
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailValue}>{service.deliveryTime}</Text>
                <Ionicons name="time-outline" size={16} color={Colors.purpleMid} />
              </View>
              {service.location && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailValue}>{service.location}</Text>
                  <Ionicons name="location-outline" size={16} color={Colors.purpleMid} />
                </View>
              )}
            </View>
          )}

          {/* Reviews */}
          {reviewsData?.reviews && reviewsData.reviews.length > 0 && (
            <View style={styles.reviewsSection}>
              <Text style={styles.sectionTitle}>
                التقييمات ({reviewsData.total})
              </Text>
              {reviewsData.reviews.slice(0, 3).map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewDate}>
                      {new Date(review.createdAt).toLocaleDateString('ar-SA')}
                    </Text>
                    <View style={styles.reviewUser}>
                      <Text style={styles.reviewName}>{review.userName}</Text>
                      <View style={styles.reviewAvatar}>
                        <Text style={styles.reviewAvatarText}>
                          {review.userName?.[0]?.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons key={s} name="star" size={12} color={s <= review.rating ? '#F59E0B' : Colors.border} />
                    ))}
                  </View>
                  {review.comment && (
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 24 }} />
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.qtyControl}>
          <TouchableOpacity
            onPress={() => setQuantity((q) => Math.max(1, q + 1))}
            style={styles.qtyBtn}
          >
            <Ionicons name="add" size={18} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{quantity}</Text>
          <TouchableOpacity
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
            style={styles.qtyBtn}
          >
            <Ionicons name="remove" size={18} color={Colors.purpleMid} />
          </TouchableOpacity>
        </View>
        <Button
          title={`أضف للسلة — ${(service.price * quantity).toFixed(2)} ر.س`}
          onPress={handleAddToCart}
          size="lg"
          style={styles.addBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10 },
  backCircle: { backgroundColor: Colors.cardBg, borderRadius: 20, padding: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  floatBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  floatBtnActive: { backgroundColor: Colors.errorLight },
  mainImage: { height: 300, backgroundColor: Colors.lightPurple },
  placeholderImage: { alignItems: 'center', justifyContent: 'center' },
  imageDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, position: 'absolute', bottom: 12, left: 0, right: 0 },
  imageDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  imageDotActive: { width: 18, backgroundColor: '#fff' },
  loadingContent: { padding: 16 },
  content: { padding: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  title: { fontFamily: 'Cairo_700Bold', fontSize: 22, color: Colors.textPrimary, flex: 1, textAlign: 'right' },
  discountBadge: { backgroundColor: Colors.accent, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  discountText: { fontFamily: 'Cairo_700Bold', fontSize: 12, color: '#fff' },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginBottom: 12 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: Colors.purpleDark },
  reviewCount: { fontFamily: 'Cairo_400Regular', fontSize: 13, color: Colors.textMuted },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, justifyContent: 'flex-end' },
  price: { fontFamily: 'Cairo_700Bold', fontSize: 26, color: Colors.primary },
  originalPrice: { fontFamily: 'Cairo_400Regular', fontSize: 16, color: Colors.textMuted, textDecorationLine: 'line-through' },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.lightPurple,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  providerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  providerAvatarImg: { width: 44, height: 44, borderRadius: 22 },
  providerAvatarText: { fontFamily: 'Cairo_700Bold', fontSize: 18, color: '#fff' },
  providerInfo: { alignItems: 'flex-end' },
  providerName: { fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: Colors.textPrimary },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  verifiedText: { fontFamily: 'Cairo_400Regular', fontSize: 11, color: Colors.success },
  descSection: { marginBottom: 16 },
  sectionTitle: { fontFamily: 'Cairo_700Bold', fontSize: 16, color: Colors.textPrimary, textAlign: 'right', marginBottom: 8 },
  description: { fontFamily: 'Cairo_400Regular', fontSize: 14, color: Colors.textSecondary, lineHeight: 24, textAlign: 'right' },
  detailsGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  detailItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.lightPurple, borderRadius: 12, padding: 10, justifyContent: 'flex-end' },
  detailValue: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: Colors.textPrimary },
  reviewsSection: { marginBottom: 8 },
  reviewCard: { backgroundColor: Colors.lightPurple, borderRadius: 14, padding: 12, marginBottom: 10 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  reviewUser: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewName: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: Colors.textPrimary },
  reviewAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  reviewAvatarText: { fontFamily: 'Cairo_700Bold', fontSize: 13, color: '#fff' },
  reviewDate: { fontFamily: 'Cairo_400Regular', fontSize: 11, color: Colors.textMuted },
  reviewStars: { flexDirection: 'row', gap: 2, marginBottom: 6, justifyContent: 'flex-end' },
  reviewComment: { fontFamily: 'Cairo_400Regular', fontSize: 13, color: Colors.textSecondary, textAlign: 'right', lineHeight: 22 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.cardBg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.lightPurple, borderRadius: 12, padding: 6 },
  qtyBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.cardBg, alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontFamily: 'Cairo_700Bold', fontSize: 16, color: Colors.textPrimary, minWidth: 24, textAlign: 'center' },
  addBtn: { flex: 1 },
});
