import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../../src/constants/colors';
import { useAuthStore } from '../../src/store/authStore';
import { getProviderDashboard } from '../../src/api/provider';
import type { OrderStatus } from '../../src/types';

const STATUS_COLORS: Record<string, string> = {
  pending: Colors.warning,
  confirmed: Colors.info,
  in_progress: Colors.primary,
  completed: Colors.success,
  cancelled: Colors.error,
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  in_progress: 'جاري',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

export default function ProviderDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { providerUser, logoutProvider, switchMode, buyerToken } = useAuthStore();

  const { data: dashboard, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['provider-dashboard'],
    queryFn: getProviderDashboard,
  });

  const stats = [
    { label: 'إجمالي الطلبات', value: dashboard?.totalOrders || 0, icon: 'receipt-outline' as const, color: Colors.primary },
    { label: 'قيد التنفيذ', value: dashboard?.pendingOrders || 0, icon: 'time-outline' as const, color: Colors.warning },
    { label: 'مكتملة', value: dashboard?.completedOrders || 0, icon: 'checkmark-circle-outline' as const, color: Colors.success },
    { label: 'الخدمات النشطة', value: dashboard?.activeServices || 0, icon: 'grid-outline' as const, color: Colors.accent },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity onPress={() => router.push('/(provider)/profile')} style={styles.iconBtn}>
            <Ionicons name="person-circle-outline" size={26} color={Colors.purpleDark} />
          </TouchableOpacity>
          {buyerToken && (
            <TouchableOpacity onPress={() => { switchMode('buyer'); router.replace('/(buyer)'); }} style={styles.iconBtn}>
              <Ionicons name="swap-horizontal" size={22} color={Colors.purpleDark} />
            </TouchableOpacity>
          )}
        </View>
        <View>
          <Text style={styles.greeting}>مرحباً، {providerUser?.name?.split(' ')[0] || 'مزود'} 👋</Text>
          <Text style={styles.subGreeting}>لوحة التحكم</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loading}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
        >
          {/* Earnings Banner */}
          <View style={styles.earningsBanner}>
            <TouchableOpacity style={styles.earningsAction} onPress={() => router.push('/(provider)/earnings')}>
              <Ionicons name="wallet-outline" size={18} color={Colors.primary} />
              <Text style={styles.earningsActionText}>عرض التفاصيل</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.earningsLabel}>إجمالي الأرباح</Text>
              <Text style={styles.earningsAmount}>{dashboard?.totalEarnings?.toFixed(2) || '0.00'} ر.س</Text>
              <Text style={styles.earningsMonth}>
                هذا الشهر: {dashboard?.thisMonthEarnings?.toFixed(2) || '0.00'} ر.س
              </Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {stats.map((stat, i) => (
              <View key={i} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
                  <Ionicons name={stat.icon} size={22} color={stat.color} />
                </View>
                <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Rating */}
          <View style={styles.ratingCard}>
            <View style={styles.ratingRight}>
              <Text style={styles.ratingValue}>{dashboard?.rating?.toFixed(1) || '0.0'}</Text>
              <Text style={styles.ratingLabel}>التقييم العام</Text>
            </View>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons key={s} name="star" size={20} color={s <= Math.round(dashboard?.rating || 0) ? '#F59E0B' : Colors.border} />
              ))}
              <Text style={styles.reviewsCount}>({dashboard?.reviewsCount || 0} تقييم)</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.qaBtn} onPress={() => router.push('/(provider)/services')}>
              <Ionicons name="add-circle" size={28} color={Colors.primary} />
              <Text style={styles.qaBtnText}>إضافة خدمة</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.qaBtn} onPress={() => router.push('/(provider)/orders')}>
              <Ionicons name="list" size={28} color={Colors.accent} />
              <Text style={styles.qaBtnText}>الطلبات</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.qaBtn} onPress={() => router.push('/(provider)/earnings')}>
              <Ionicons name="cash" size={28} color={Colors.success} />
              <Text style={styles.qaBtnText}>الأرباح</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Orders */}
          {dashboard?.recentOrders && dashboard.recentOrders.length > 0 && (
            <View style={styles.recentSection}>
              <View style={styles.sectionHeader}>
                <TouchableOpacity onPress={() => router.push('/(provider)/orders')}>
                  <Text style={styles.seeAll}>عرض الكل</Text>
                </TouchableOpacity>
                <Text style={styles.sectionTitle}>أحدث الطلبات</Text>
              </View>
              {dashboard.recentOrders.slice(0, 5).map((order) => (
                <View key={order.id} style={styles.orderRow}>
                  <View style={[styles.orderStatus, { backgroundColor: `${STATUS_COLORS[order.status] || Colors.primary}20` }]}>
                    <Text style={[styles.orderStatusText, { color: STATUS_COLORS[order.status] || Colors.primary }]}>
                      {STATUS_LABELS[order.status] || order.status}
                    </Text>
                  </View>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderNum}>#{order.orderNumber}</Text>
                    <Text style={styles.orderTotal}>{order.total?.toFixed(2)} ر.س</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  topBarLeft: { flexDirection: 'row', gap: 4 },
  greeting: { fontFamily: 'Cairo_700Bold', fontSize: 18, color: Colors.textPrimary, textAlign: 'right' },
  subGreeting: { fontFamily: 'Cairo_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'right' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.lightPurple, alignItems: 'center', justifyContent: 'center' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  earningsBanner: {
    margin: 16, backgroundColor: Colors.purpleGradientStart, borderRadius: 20, padding: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: Colors.purpleGradientStart, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 5,
  },
  earningsLabel: { fontFamily: 'Cairo_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'right', marginBottom: 4 },
  earningsAmount: { fontFamily: 'Cairo_700Bold', fontSize: 32, color: '#fff', textAlign: 'right' },
  earningsMonth: { fontFamily: 'Cairo_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: 'right', marginTop: 4 },
  earningsAction: { alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 12 },
  earningsActionText: { fontFamily: 'Cairo_600SemiBold', fontSize: 12, color: '#fff' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1, minWidth: '44%', backgroundColor: Colors.cardBg, borderRadius: 16, padding: 16, alignItems: 'flex-end',
    shadowColor: Colors.shadowColorDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  statIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontFamily: 'Cairo_700Bold', fontSize: 28 },
  statLabel: { fontFamily: 'Cairo_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 2, textAlign: 'right' },
  ratingCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.cardBg, borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ratingRight: { alignItems: 'flex-end' },
  ratingValue: { fontFamily: 'Cairo_700Bold', fontSize: 40, color: '#F59E0B' },
  ratingLabel: { fontFamily: 'Cairo_400Regular', fontSize: 12, color: Colors.textMuted },
  ratingStars: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reviewsCount: { fontFamily: 'Cairo_400Regular', fontSize: 12, color: Colors.textMuted, marginRight: 4 },
  quickActions: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 20, gap: 10 },
  qaBtn: { flex: 1, backgroundColor: Colors.cardBg, borderRadius: 14, padding: 16, alignItems: 'center', gap: 6, shadowColor: Colors.shadowColorDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  qaBtnText: { fontFamily: 'Cairo_600SemiBold', fontSize: 12, color: Colors.textPrimary },
  recentSection: { marginHorizontal: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontFamily: 'Cairo_700Bold', fontSize: 16, color: Colors.textPrimary },
  seeAll: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: Colors.primary },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.cardBg, borderRadius: 14, padding: 14, marginBottom: 10 },
  orderInfo: { alignItems: 'flex-end' },
  orderNum: { fontFamily: 'Cairo_700Bold', fontSize: 14, color: Colors.textPrimary },
  orderTotal: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: Colors.primary, marginTop: 2 },
  orderStatus: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  orderStatusText: { fontFamily: 'Cairo_600SemiBold', fontSize: 12 },
});
