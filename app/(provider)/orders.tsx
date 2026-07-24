import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors } from '../../src/constants/colors';
import { Header } from '../../src/components/common/Header';
import { EmptyState } from '../../src/components/common/EmptyState';
import { getProviderOrders, updateOrderStatus } from '../../src/api/provider';
import type { Order } from '../../src/types';

const STATUS_OPTIONS = [
  { value: 'confirmed', label: 'تأكيد الطلب', color: Colors.info },
  { value: 'in_progress', label: 'بدء التنفيذ', color: Colors.primary },
  { value: 'completed', label: 'تم الإنجاز', color: Colors.success },
];

const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  in_progress: 'جاري التنفيذ',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

const STATUS_COLORS: Record<string, string> = {
  pending: Colors.warning,
  confirmed: Colors.info,
  in_progress: Colors.primary,
  completed: Colors.success,
  cancelled: Colors.error,
};

export default function ProviderOrdersScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [activeStatus, setActiveStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['provider-orders', activeStatus],
    queryFn: () => getProviderOrders({ status: activeStatus || undefined, limit: 50 }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      updateOrderStatus(orderId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-orders'] }),
    onError: () => Alert.alert('خطأ', 'تعذّر تحديث حالة الطلب'),
  });

  const handleStatusUpdate = (order: Order) => {
    const nextStatuses = STATUS_OPTIONS.filter((s) => {
      if (order.status === 'pending') return s.value === 'confirmed' || s.value === 'in_progress';
      if (order.status === 'confirmed') return s.value === 'in_progress';
      if (order.status === 'in_progress') return s.value === 'completed';
      return false;
    });

    if (!nextStatuses.length) return;

    Alert.alert('تحديث الحالة', 'اختر الحالة الجديدة للطلب', [
      { text: 'إلغاء', style: 'cancel' },
      ...nextStatuses.map((s) => ({
        text: s.label,
        onPress: () => statusMutation.mutate({ orderId: order.id, status: s.value }),
      })),
    ]);
  };

  const TABS = [
    { label: 'الكل', value: '' },
    { label: 'انتظار', value: 'pending' },
    { label: 'جاري', value: 'in_progress' },
    { label: 'مكتمل', value: 'completed' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="الطلبات الواردة" showBack />

      <View style={styles.tabsRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            onPress={() => setActiveStatus(tab.value)}
            style={[styles.tab, activeStatus === tab.value && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeStatus === tab.value && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loading}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : !data?.orders.length ? (
        <EmptyState icon="receipt-outline" title="لا توجد طلبات" subtitle="لم يصلك أي طلب بعد" />
      ) : (
        <FlatList
          data={data.orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.list}
          renderItem={({ item: order }) => (
            <View style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[order.status] || Colors.primary}20` }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[order.status] || Colors.primary }]}>
                    {STATUS_LABELS[order.status] || order.status}
                  </Text>
                </View>
                <View>
                  <Text style={styles.orderNum}>#{order.orderNumber}</Text>
                  <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString('ar-SA')}</Text>
                </View>
              </View>

              <View style={styles.orderItems}>
                {order.items?.slice(0, 2).map((item) => (
                  <Text key={item.id} style={styles.itemName} numberOfLines={1}>• {item.service?.title}</Text>
                ))}
                {(order.items?.length || 0) > 2 && (
                  <Text style={styles.moreItems}>+{(order.items?.length || 0) - 2} أخرى</Text>
                )}
              </View>

              <View style={styles.orderFooter}>
                {!['completed', 'cancelled', 'refunded'].includes(order.status) && (
                  <TouchableOpacity
                    onPress={() => handleStatusUpdate(order)}
                    style={styles.updateBtn}
                    disabled={statusMutation.isPending}
                  >
                    <Ionicons name="refresh-outline" size={14} color={Colors.primary} />
                    <Text style={styles.updateBtnText}>تحديث الحالة</Text>
                  </TouchableOpacity>
                )}
                <Text style={styles.total}>{order.total?.toFixed(2)} ر.س</Text>
              </View>
            </View>
          )}
          ListFooterComponent={<View style={{ height: 80 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  tabsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tab: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: Colors.lightPurple, borderWidth: 1, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontFamily: 'Cairo_600SemiBold', fontSize: 12, color: Colors.purpleMid },
  tabTextActive: { color: '#fff' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16 },
  orderCard: { backgroundColor: Colors.cardBg, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: Colors.shadowColorDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  orderNum: { fontFamily: 'Cairo_700Bold', fontSize: 15, color: Colors.textPrimary, textAlign: 'right' },
  orderDate: { fontFamily: 'Cairo_400Regular', fontSize: 11, color: Colors.textMuted, textAlign: 'right' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontFamily: 'Cairo_600SemiBold', fontSize: 12 },
  orderItems: { marginBottom: 12, alignItems: 'flex-end' },
  itemName: { fontFamily: 'Cairo_400Regular', fontSize: 13, color: Colors.textSecondary, textAlign: 'right', marginBottom: 3 },
  moreItems: { fontFamily: 'Cairo_400Regular', fontSize: 12, color: Colors.textMuted, textAlign: 'right' },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10 },
  total: { fontFamily: 'Cairo_700Bold', fontSize: 16, color: Colors.primary },
  updateBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.lightPurple, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10 },
  updateBtnText: { fontFamily: 'Cairo_600SemiBold', fontSize: 12, color: Colors.primary },
});
