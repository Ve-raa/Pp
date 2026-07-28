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
import { Colors } from '../../constants/colors';
import type { ServiceProvider } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(160, (SCREEN_WIDTH - 48) / 2);

interface ProviderCardProps {
  provider: ServiceProvider;
  onPress: () => void;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  onPress,
}) => {
  const initials = provider.name
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase();

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={[styles.card, { width: CARD_WIDTH }]}
    >
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
            <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
          </View>
        )}
      </View>

      {/* Info */}
      <Text style={styles.name} numberOfLines={1}>
        {provider.name}
      </Text>

      {provider.category && provider.category.trim() !== provider.name.trim() && (
        <Text style={styles.category} numberOfLines={1}>
          {provider.category}
        </Text>
      )}

      {provider.city && (
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={11} color={Colors.textMuted} />
          <Text style={styles.city} numberOfLines={1}>
            {provider.city}
          </Text>
        </View>
      )}

      {/* Rating */}
      <View style={styles.ratingRow}>
        <Ionicons name="star" size={12} color="#F59E0B" />
        <Text style={styles.rating}>
          {provider.rating?.toFixed(1) ?? '0.0'}
        </Text>
        {(provider.reviewsCount ?? 0) > 0 && (
          <Text style={styles.reviewCount}>
            ({provider.reviewsCount})
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    marginLeft: 12,
    shadowColor: Colors.shadowColorDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.lightPurple,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  avatarInitials: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 22,
    color: '#fff',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    backgroundColor: Colors.cardBg,
    borderRadius: 10,
    padding: 1,
  },
  name: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 3,
  },
  category: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 11,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 3,
    backgroundColor: Colors.lightPurple,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 6,
  },
  city: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rating: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
    color: Colors.purpleDark,
  },
  reviewCount: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 10,
    color: Colors.textMuted,
  },
});
