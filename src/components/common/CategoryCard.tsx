import React from 'react';
import {
  TouchableOpacity,
  Text,
  Image,
  View,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import type { Category } from '../../types';

const CATEGORY_COLORS = [
  Colors.primary,
  Colors.accent,
  '#10B981',
  '#F59E0B',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
];

interface CategoryCardProps {
  category: Category;
  onPress: () => void;
  index?: number;
  size?: 'sm' | 'md';
  style?: object;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onPress,
  index = 0,
  size = 'md',
  style,
}) => {
  const color = category.color || CATEGORY_COLORS[index % CATEGORY_COLORS.length];
  const isSmall = size === 'sm';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.container, isSmall && styles.containerSm, style]}
    >
      <View style={[styles.circle, isSmall && styles.circleSm, { backgroundColor: `${color}20` }]}>
        {category.image ? (
          <Image
            source={{ uri: category.image }}
            style={[styles.image, isSmall && styles.imageSm]}
          />
        ) : (
          <Ionicons
            name="grid-outline"
            size={isSmall ? 20 : 26}
            color={color}
          />
        )}
      </View>
      <Text
        style={[styles.name, isSmall && styles.nameSm]}
        numberOfLines={2}
      >
        {category.name}
      </Text>
      {!isSmall && category.servicesCount !== undefined && (
        <Text style={styles.count}>{category.servicesCount} خدمة</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 80,
    marginHorizontal: 6,
  },
  containerSm: { width: 64 },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  circleSm: { width: 48, height: 48, borderRadius: 24, marginBottom: 6 },
  image: { width: 36, height: 36, borderRadius: 18 },
  imageSm: { width: 28, height: 28, borderRadius: 14 },
  name: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  nameSm: { fontSize: 11 },
  count: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
});
