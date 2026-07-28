import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  FlatList, Alert, ActivityIndicator, Dimensions, Modal, Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { hapticImpact, hapticNotification } from '../../src/utils/haptics';
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
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Ref for the image carousel ScrollView
  const carouselRef = useRef<FlatList<string>>(null);

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
      hapticImpact();
    },
  });

  const handleAddToCart = () => {
    if (!service) return;
    if (!buyerToken) {
      setShowLoginModal(true);
      return;
    }
    addItem(service, quantity);
    hapticNotification();
    Alert.alert('تمت الإضافة ✅', 'تمت إضافة الخدمة إلى سلتك', [
      { text: 'متابعة التسوق' },
      { text: 'عرض السلة', onPress: () => router.push('/(buyer)/cart') },
    ]);
  };

  // Navigate carousel to a specific index
  const goToImage = (index: number) => {
    carouselRef.current?.scrollToIndex({ index, animated: true });
    setActiveImage(index);
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
      {/* Custom login-required modal */}
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
              سجّل دخولك لإضافة الخدمة إلى سلتك والاستمتاع بجميع المميزات
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
        {/* ── Image Carousel ──────────────────────────────────────── */}
        {images.length > 0 ? (
          <View style={styles.carouselWrapper}>
            <FlatList
              ref={carouselRef}
              data={images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={[styles.mainImage, { width: W }]}
                  resizeMode="cover"
                />
              )}
              getItemLayout={(_, index) => ({ length: W, offset: W * index, index })}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / W);
                setActiveImage(index);
              }}
              scrollEventThrottle={16}
              decelerationRate="fast"
              bounces={false}
            />

            {/* Dot indicators — only when more than 1 image */}
            {images.length > 1 && (
              <View style={styles.dotsRow}>
                {images.map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => goToImage(i)}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  >
                    <View
                      style={[
                        styles.dot,
                        i === activeImage ? styles.dotActive : styles.dotInactive,
                      ]}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Counter badge — only when more than 1 image */}
            {images.length > 1 && (
              <View style={styles.counterBadge}>
                <Text style={styles.counterText}>
                  {activeImage + 1} / {images.length}
                </Text>
              </View>
            )}

            {/* Prev / Next arrows — only when more than 1 image */}
            {images.length > 1 && (
              <>
                {activeImage > 0 && (
                  <TouchableOpacity
                    style={[styles.arrowBtn, styles.arrowRight]}
                    onPress={() => goToImage(activeImage - 1)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="chevron-forward" size={20} color="#fff" />
                  </TouchableOpacity>
                )}
                {activeImage < images.length - 1 && (
                  <TouchableOpacity
                    style={[styles.arrowBtn, styles.arrowLeft]}
                    onPress={() => goToImage(activeImage + 1)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="chevron-back" size={20} color="#fff" />
                  </TouchableOpacity>
                )}
              </>
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
              <Text style={styles.originalPrice}>{service.originalPrice} د.إ</Text>
            )}
            <Text style={styles.price}>{service.price} د.إ</Text>
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
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.qtyControl}>
          <TouchableOpacity
            onPress={() => setQuantity((q) => Math.max(1, q + 1))}
            style={styles.qtyBtn}
          >
            <Ionicons name="add" size={16} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{quantity}</Text>
          <TouchableOpacity
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
            style={styles.qtyBtn}
          >
            <Ionicons name="remove" size={16} color={Colors.purpleMid} />
          </TouchableOpacity>
        </View>
        <Button
          title="أضف للسلة"
          onPress={handleAddToCart}
          size="sm"
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
  backCircle: {
    backgroundColor: Colors.cardBg,
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
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

  // ── Carousel ──────────────────────────────────────────────────────────────────
  carouselWrapper: {
    position: 'relative',
    height: 300,
    backgroundColor: Colors.lightPurple,
  },
  mainImage: {
    height: 300,
    backgroundColor: Colors.lightPurple,
  },
  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Dots
  dotsRow: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    borderRadius: 4,
    height: 7,
  },
  dotActive: {
    width: 22,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  dotInactive: {
    width: 7,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },

  // Counter badge
  counterBadge: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  counterText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
    color: '#fff',
  },

  // Prev / Next arrows
  arrowBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowRight: { right: 10 },
  arrowLeft:  { left: 10 },

  // ── Content ───────────────────────────────────────────────────────────────────
  loadingContent: { padding: 16 },
  content: { padding: 16 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 22,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  discountBadge: {
    backgroundColor: Colors.accent,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  discountText: { fontFamily: 'Cairo_700Bold', fontSize: 12, color: '#fff' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 12,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: Colors.purpleDark },
  reviewCount: { fontFamily: 'Cairo_400Regular', fontSize: 13, color: Colors.textMuted },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    justifyContent: 'flex-end',
  },
  price: { fontFamily: 'Cairo_700Bold', fontSize: 26, color: Colors.primary },
  originalPrice: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 16,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.lightPurple,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  providerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerAvatarImg: { width: 44, height: 44, borderRadius: 22 },
  providerAvatarText: { fontFamily: 'Cairo_700Bold', fontSize: 18, color: '#fff' },
  providerInfo: { alignItems: 'flex-end' },
  providerName: { fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: Colors.textPrimary },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  verifiedText: { fontFamily: 'Cairo_400Regular', fontSize: 11, color: Colors.success },
  descSection: { marginBottom: 16 },
  sectionTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    color: Colors.textPrimary,
    textAlign: 'right',
    marginBottom: 8,
  },
  description: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 24,
    textAlign: 'right',
  },
  detailsGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.lightPurple,
    borderRadius: 12,
    padding: 10,
    justifyContent: 'flex-end',
  },
  detailValue: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: Colors.textPrimary },
  reviewsSection: { marginBottom: 8 },
  reviewCard: {
    backgroundColor: Colors.lightPurple,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewUser: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewName: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: Colors.textPrimary },
  reviewAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: { fontFamily: 'Cairo_700Bold', fontSize: 13, color: '#fff' },
  reviewDate: { fontFamily: 'Cairo_400Regular', fontSize: 11, color: Colors.textMuted },
  reviewStars: { flexDirection: 'row', gap: 2, marginBottom: 6, justifyContent: 'flex-end' },
  reviewComment: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'right',
    lineHeight: 22,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: Colors.cardBg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 6,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.lightPurple,
    borderRadius: 10,
    padding: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 15,
    color: Colors.textPrimary,
    minWidth: 22,
    textAlign: 'center',
  },
  addBtn: { flex: 0, minWidth: 118 },

  // Login modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26,22,37,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  modalBox: {
    width: '100%',
    backgroundColor: Colors.cardBg,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.lightPurple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
