import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/colors';
import type { Service } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

interface ServiceCardProps {
  service: Service;
  onPress: () => void;
  onWishlistPress?: () => void;
  isWishlisted?: boolean;
  variant?: 'grid' | 'list' | 'featured';
  style?: object;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onPress,
  onWishlistPress,
  isWishlisted = false,
  variant = 'grid',
  style,
}) => {
  const handleWishlist = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onWishlistPress?.();
  };

  const imageUri = service.image || service.images?.[0] || 'https://veraapp.app/assets/images/placeholder.jpg';
  const discountPct = service.originalPrice
    ? Math.round(((service.originalPrice - service.price) / service.originalPrice) * 100)
    : 0;

  if (variant === 'list') {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={[styles.listCard, style]}
      >
        <Image source={{ uri: imageUri }} style={styles.listImage} />
        <View style={styles.listContent}>
          <Text style={styles.listTitle} numberOfLines={2}>{service.title}</Text>
          {service.provider && (
            <Text style={styles.providerName} numberOfLines={1}>
              {service.provider.name}
            </Text>
          )}
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.rating}>{service.rating?.toFixed(1) || '0.0'}</Text>
            <Text style={styles.ratingCount}>({service.reviewsCount || 0})</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{service.price} ر.س</Text>
            {service.originalPrice && (
              <Text style={styles.originalPrice}>{service.originalPrice} ر.س</Text>
            )}
          </View>
        </View>
        {onWishlistPress && (
          <TouchableOpacity onPress={handleWishlist} style={styles.wishlistBtn}>
            <Ionicons
              name={isWishlisted ? 'heart' : 'heart-outline'}
              size={20}
              color={isWishlisted ? Colors.accent : Colors.purpleMid}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'featured') {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={[styles.featuredCard, style]}
      >
        <Image source={{ uri: imageUri }} style={styles.featuredImage} />
        <View style={styles.featuredOverlay} />
        {discountPct > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discountPct}%</Text>
          </View>
        )}
        {onWishlistPress && (
          <TouchableOpacity onPress={handleWishlist} style={styles.featuredWishlist}>
            <Ionicons
              name={isWishlisted ? 'heart' : 'heart-outline'}
              size={18}
              color={isWishlisted ? Colors.accent : Colors.textWhite}
            />
          </TouchableOpacity>
        )}
        <View style={styles.featuredContent}>
          <Text style={styles.featuredTitle} numberOfLines={2}>{service.title}</Text>
          <View style={styles.featuredBottom}>
            <Text style={styles.featuredPrice}>{service.price} ر.س</Text>
            <View style={styles.featuredRating}>
              <Ionicons name="star" size={11} color="#F59E0B" />
              <Text style={styles.featuredRatingText}>{service.rating?.toFixed(1) || '0.0'}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Grid variant (default)
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.gridCard, { width: CARD_WIDTH }, style]}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.gridImage} />
        {discountPct > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discountPct}%</Text>
          </View>
        )}
        {onWishlistPress && (
          <TouchableOpacity onPress={handleWishlist} style={styles.gridWishlist}>
            <Ionicons
              name={isWishlisted ? 'heart' : 'heart-outline'}
              size={16}
              color={isWishlisted ? Colors.accent : Colors.purpleMid}
            />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.gridContent}>
        <Text style={styles.gridTitle} numberOfLines={2}>{service.title}</Text>
        {service.provider && (
          <Text style={styles.providerName} numberOfLines={1}>{service.provider.name}</Text>
        )}
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={11} color="#F59E0B" />
          <Text style={styles.rating}>{service.rating?.toFixed(1) || '0.0'}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{service.price} ر.س</Text>
          {service.originalPrice && (
            <Text style={styles.originalPrice}>{service.originalPrice} ر.س</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Grid
  gridCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: Colors.shadowColorDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: { position: 'relative' },
  gridImage: { width: '100%', height: 130, backgroundColor: Colors.lightPurple },
  gridWishlist: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.cardBg,
    borderRadius: 20,
    padding: 5,
  },
  gridContent: { padding: 10 },
  gridTitle: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: Colors.textPrimary,
    marginBottom: 3,
    textAlign: 'right',
  },

  // List
  listCard: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: Colors.shadowColorDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  listImage: { width: 110, height: 110, backgroundColor: Colors.lightPurple },
  listContent: { flex: 1, padding: 12, justifyContent: 'center' },
  listTitle: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 4,
    textAlign: 'right',
  },
  wishlistBtn: { padding: 12, justifyContent: 'center' },

  // Featured
  featuredCard: {
    width: 220,
    backgroundColor: Colors.cardBg,
    borderRadius: 18,
    overflow: 'hidden',
    marginLeft: 12,
    shadowColor: Colors.shadowColorDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  featuredImage: { width: '100%', height: 150, backgroundColor: Colors.lightPurple },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(26,22,37,0.6)',
  },
  featuredWishlist: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 6,
  },
  featuredContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  featuredTitle: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: Colors.textWhite,
    marginBottom: 4,
    textAlign: 'right',
  },
  featuredBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  featuredPrice: { fontFamily: 'Cairo_700Bold', fontSize: 14, color: Colors.accent },
  featuredRating: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  featuredRatingText: { fontFamily: 'Cairo_400Regular', fontSize: 11, color: Colors.textWhite80 },

  // Shared
  providerName: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
    textAlign: 'right',
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6 },
  rating: { fontFamily: 'Cairo_600SemiBold', fontSize: 12, color: Colors.purpleDark },
  ratingCount: { fontFamily: 'Cairo_400Regular', fontSize: 11, color: Colors.textMuted },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  price: { fontFamily: 'Cairo_700Bold', fontSize: 15, color: Colors.primary },
  originalPrice: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.accent,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: { fontFamily: 'Cairo_700Bold', fontSize: 10, color: Colors.textWhite },
});
