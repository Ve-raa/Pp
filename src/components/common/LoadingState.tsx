import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(animValue, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const opacity = animValue.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: Colors.divider, opacity }, style]}
    />
  );
};

// ─── Service Card Skeleton ────────────────────────────────────────────────────
export const ServiceCardSkeleton: React.FC = () => (
  <View style={skeletonStyles.gridCard}>
    <Skeleton height={130} borderRadius={0} />
    <View style={skeletonStyles.content}>
      <Skeleton height={14} width="80%" style={skeletonStyles.mb8} />
      <Skeleton height={12} width="50%" style={skeletonStyles.mb8} />
      <Skeleton height={16} width="40%" />
    </View>
  </View>
);

// ─── Full page loading ────────────────────────────────────────────────────────
export const HomeLoadingSkeleton: React.FC = () => (
  <View style={skeletonStyles.container}>
    {/* Banner skeleton */}
    <Skeleton height={180} borderRadius={16} style={skeletonStyles.mb16} />
    {/* Categories row */}
    <View style={skeletonStyles.row}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={skeletonStyles.categoryItem}>
          <Skeleton width={60} height={60} borderRadius={30} style={skeletonStyles.mb8} />
          <Skeleton width={50} height={10} />
        </View>
      ))}
    </View>
    {/* Service cards */}
    <Skeleton height={20} width="40%" style={{ ...skeletonStyles.mb12, alignSelf: 'flex-end' }} />
    <View style={skeletonStyles.gridRow}>
      <ServiceCardSkeleton />
      <ServiceCardSkeleton />
    </View>
    <View style={skeletonStyles.gridRow}>
      <ServiceCardSkeleton />
      <ServiceCardSkeleton />
    </View>
  </View>
);

const skeletonStyles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: Colors.background },
  content: { padding: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  categoryItem: { alignItems: 'center' },
  gridRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  gridCard: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.shadowColorDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  mb8: { marginBottom: 8 },
  mb12: { marginBottom: 12 },
  mb16: { marginBottom: 16 },
});
