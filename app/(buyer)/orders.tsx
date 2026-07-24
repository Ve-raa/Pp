import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../../src/constants/colors';
import { EmptyState } from '../../src/components/common/EmptyState';
import { getOrders } from '../../src/api/orders';
import type { Order, OrderStatus } from '../../src/types';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'تم التأكيد',
  in_progress: 'جاري التنفيذ',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  refunded: 'مسترد',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: Colors.warning,
  confirmed: Colors.info,
  in_progress: Colors.primary,
  completed: Colors.success,
  cancelled: Colors.error,
  refunded: Colors.textMuted,
};

const TABS = [
  { label: 'الكل', value: '' },
  { label: 'قيد التنفيذ', value: 'in_progress' },
  { label: 'مكتملة', value: 'completed' },
  { label: 'ملغاة', value: 'cancelled' },
];

export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeStatus, setActiveStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['orders', activeStatus],
    queryFn: () => getOrders({ status: activeStatus || undefined, limit: 30 }),
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>طلباتي</Text>
      </View>

      {/* Status tabs */}
      <View style={styles.tabsContainer}>
        <FlatList
          horizontal
          data={TABS}
          keyExtractor={(t) => t.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setActiveStatus(item.value)}
              style={[styles.tab, activeStatus === item.value && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeStatus === item.value && styles.tabTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : !data?.orders.length ? (
        <EmptyState
          icon="receipt-outline"
          title="لا توجد طلبات"
          subtitle="لم تقم بأي طلبات بعد"
          actionLabel="تسوق الآن"
          onAction={() => router.push('/(buyer)')}
        />
      ) : (
        <FlatList
          data={data.orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: order }) => (
            <TouchableOpacity
              style={styles.orderCard}
              onPress={() => router.push(`/order/${order.id}`)}
              activeOpacity={0.8}
            >
              <View style={styles.orderHeader}>
                <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[order.status]}20` }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[order.status] }]}>
                    {STATUS_LABELS[order.status]}
                  </Text>
                </View>
                <View>
                  <Text style={styles.orderNum}>#{order.orderNumber}</Text>
                  <Text style={styles.orderDate}>
                    {new Date(order.createdAt).toLocaleDateString('ar-SA')}
                  </Text>
                </View>
              </View>
              <View style={styles.orderBody}>
                <Text style={styles.itemsText}>
                  {order.items?.length || 0} {order.items?.length === 1 ? 'خدمة' : 'خدمات'}
                </Text>
                <View style={styles.orderFooter}>
                  <Ionicons name="chevron-back" size={16} color={Colors.purpleMid} />
                  <Text style={styles.totalText}>{order.total?.toFixed(2)} ر.س</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.cardBg,
  },
  headerTitle: { fontFamily: 'Cairo_700Bold', fontSize: 20, color: Colors.textPrimary, textAlign: 'right' },
  tabsContainer: { paddingVertical: 12 },
  tab: { paddingVertical: 7, paddingHorizontal: 16, borderRadius: 20, backgroundColor: Colors.lightPurple, borderWidth: 1, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: Colors.purpleMid },
  tabTextActive: { color: '#fff' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 100 },
  orderCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadowColorDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  orderNum: { fontFamily: 'Cairo_700Bold', fontSize: 15, color: Colors.textPrimary, textAlign: 'right' },
  orderDate: { fontFamily: 'Cairo_400Regular', fontSize: 12, color: Colors.textMuted, textAlign: 'right' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontFamily: 'Cairo_600SemiBold', fontSize: 12 },
  orderBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemsText: { fontFamily: 'Cairo_400Regular', fontSize: 13, color: Colors.textMuted },
  orderFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  totalText: { fontFamily: 'Cairo_700Bold', fontSize: 16, color: Colors.primary },
});
