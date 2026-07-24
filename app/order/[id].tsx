import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors } from '../../src/constants/colors';
import { Button } from '../../src/components/common/Button';
import { Skeleton } from '../../src/components/common/LoadingState';
import { Header } from '../../src/components/common/Header';
import { getOrderById, cancelOrder, rateOrder } from '../../src/api/orders';
import type { OrderStatus } from '../../src/types';

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

const STATUS_STEPS: OrderStatus[] = ['pending', 'confirmed', 'in_progress', 'completed'];

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [ratingModal, setRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrderById(id!),
    enabled: !!id,
    refetchInterval: (data) =>
      data?.status === 'in_progress' || data?.status === 'confirmed' ? 30000 : false,
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => cancelOrder(id!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      Alert.alert('تم الإلغاء', 'تم إلغاء طلبك بنجاح');
    },
    onError: () => Alert.alert('خطأ', 'تعذّر إلغاء الطلب. حاول مرة أخرى.'),
  });

  const rateMutation = useMutation({
    mutationFn: () => rateOrder(id!, { rating, review }),
    onSuccess: () => {
      setRatingModal(false);
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      Alert.alert('شكراً! 🌟', 'تم إرسال تقييمك بنجاح');
    },
  });

  const handleCancel = () => {
    Alert.alert('إلغاء الطلب', 'هل أنت متأكد من إلغاء الطلب؟', [
      { text: 'لا', style: 'cancel' },
      {
        text: 'إلغاء الطلب',
        style: 'destructive',
        onPress: () => cancelMutation.mutate('cancelled by user'),
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Header title="تفاصيل الطلب" showBack />
        <View style={{ padding: 16, gap: 12 }}>
          <Skeleton height={100} borderRadius={16} />
          <Skeleton height={60} borderRadius={16} />
          <Skeleton height={160} borderRadius={16} />
        </View>
      </View>
    );
  }
  if (!order) return null;

  const statusIndex = STATUS_STEPS.indexOf(order.status as OrderStatus);
  const isActive = !['cancelled', 'refunded'].includes(order.status);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title={`طلب #${order.orderNumber}`} showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[order.status as OrderStatus]}20` }]}>
            <Text style={[styles.statusText, { color: STATUS_COLORS[order.status as OrderStatus] }]}>
              {STATUS_LABELS[order.status as OrderStatus] || order.status}
            </Text>
          </View>
          <Text style={styles.orderDate}>
            {new Date(order.createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        {/* Progress tracker */}
        {isActive && (
          <View style={styles.progressCard}>
            <Text style={styles.sectionTitle}>حالة الطلب</Text>
            <View style={styles.steps}>
              {STATUS_STEPS.map((step, i) => (
                <View key={step} style={styles.stepItem}>
                  <View style={[styles.stepCircle, i <= statusIndex && styles.stepCircleActive]}>
                    {i < statusIndex ? (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    ) : (
                      <Text style={styles.stepNum}>{i + 1}</Text>
                    )}
                  </View>
                  {i < STATUS_STEPS.length - 1 && (
                    <View style={[styles.stepLine, i < statusIndex && styles.stepLineActive]} />
                  )}
                  <Text style={[styles.stepLabel, i === statusIndex && styles.stepLabelActive]}>
                    {STATUS_LABELS[step]}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>الخدمات المطلوبة</Text>
          {order.items?.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <Text style={styles.itemPrice}>{item.price} ر.س × {item.quantity}</Text>
              <Text style={styles.itemName}>{item.service?.title}</Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>ملخص الفاتورة</Text>
          <View style={styles.row}>
            <Text style={styles.val}>{order.subtotal?.toFixed(2)} ر.س</Text>
            <Text style={styles.lbl}>المجموع الفرعي</Text>
          </View>
          {order.discount && order.discount > 0 ? (
            <View style={styles.row}>
              <Text style={[styles.val, { color: Colors.success }]}>-{order.discount?.toFixed(2)} ر.س</Text>
              <Text style={styles.lbl}>الخصم</Text>
            </View>
          ) : null}
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalVal}>{order.total?.toFixed(2)} ر.س</Text>
            <Text style={styles.totalLbl}>الإجمالي</Text>
          </View>
        </View>

        {/* Payment */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.val}>{order.paymentMethod || 'غير محدد'}</Text>
            <Text style={styles.lbl}>طريقة الدفع</Text>
          </View>
          <View style={styles.row}>
            <View style={[styles.payStatusBadge, { backgroundColor: order.paymentStatus === 'paid' ? Colors.successLight : Colors.warningLight }]}>
              <Text style={{ color: order.paymentStatus === 'paid' ? Colors.success : Colors.warning, fontFamily: 'Cairo_600SemiBold', fontSize: 12 }}>
                {order.paymentStatus === 'paid' ? 'مدفوع' : 'قيد الدفع'}
              </Text>
            </View>
            <Text style={styles.lbl}>حالة الدفع</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsCard}>
          {order.status === 'pending' && (
            <Button
              title="إلغاء الطلب"
              onPress={handleCancel}
              variant="danger"
              fullWidth
              loading={cancelMutation.isPending}
              style={{ marginBottom: 10 }}
            />
          )}
          {order.status === 'completed' && !order.rating && (
            <Button
              title="تقييم الخدمة ⭐"
              onPress={() => setRatingModal(true)}
              variant="secondary"
              fullWidth
            />
          )}
        </View>
      </ScrollView>

      {/* Rating Modal */}
      <Modal visible={ratingModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>تقييم الخدمة</Text>
            <Text style={styles.modalSubtitle}>كيف كانت تجربتك؟</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setRating(s)}>
                  <Ionicons name="star" size={36} color={s <= rating ? '#F59E0B' : Colors.border} />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.reviewInput}
              placeholder="اكتب تعليقك (اختياري)"
              placeholderTextColor={Colors.textLight}
              value={review}
              onChangeText={setReview}
              multiline
              numberOfLines={3}
              textAlign="right"
            />
            <View style={styles.modalBtns}>
              <Button title="إلغاء" onPress={() => setRatingModal(false)} variant="ghost" style={{ flex: 1 }} />
              <Button title="إرسال" onPress={() => rateMutation.mutate()} loading={rateMutation.isPending} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 16,
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.shadowColorDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontFamily: 'Cairo_700Bold', fontSize: 14 },
  orderDate: { fontFamily: 'Cairo_400Regular', fontSize: 13, color: Colors.textMuted },
  progressCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.cardBg, borderRadius: 16, padding: 16 },
  steps: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  stepItem: { alignItems: 'center', flex: 1 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  stepCircleActive: { backgroundColor: Colors.primary },
  stepNum: { fontFamily: 'Cairo_700Bold', fontSize: 12, color: Colors.textMuted },
  stepLine: { position: 'absolute', top: 14, right: '50%', left: '50%', height: 2, width: '100%', backgroundColor: Colors.border, zIndex: -1 },
  stepLineActive: { backgroundColor: Colors.primary },
  stepLabel: { fontFamily: 'Cairo_400Regular', fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
  stepLabelActive: { fontFamily: 'Cairo_600SemiBold', color: Colors.primary },
  card: { marginHorizontal: 16, marginBottom: 12, backgroundColor: Colors.cardBg, borderRadius: 16, padding: 16 },
  sectionTitle: { fontFamily: 'Cairo_700Bold', fontSize: 15, color: Colors.textPrimary, textAlign: 'right', marginBottom: 12 },
  orderItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  itemName: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: Colors.textPrimary, flex: 1, textAlign: 'right' },
  itemPrice: { fontFamily: 'Cairo_700Bold', fontSize: 13, color: Colors.primary },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  lbl: { fontFamily: 'Cairo_400Regular', fontSize: 14, color: Colors.textMuted },
  val: { fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: Colors.textPrimary },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, marginTop: 4 },
  totalLbl: { fontFamily: 'Cairo_700Bold', fontSize: 16, color: Colors.textPrimary },
  totalVal: { fontFamily: 'Cairo_700Bold', fontSize: 18, color: Colors.primary },
  payStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  actionsCard: { marginHorizontal: 16, marginBottom: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontFamily: 'Cairo_700Bold', fontSize: 20, color: Colors.textPrimary, textAlign: 'center', marginBottom: 4 },
  modalSubtitle: { fontFamily: 'Cairo_400Regular', fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginBottom: 20 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
  reviewInput: { backgroundColor: Colors.lightPurple, borderRadius: 12, padding: 12, fontFamily: 'Cairo_400Regular', fontSize: 14, color: Colors.textPrimary, minHeight: 80, textAlignVertical: 'top', marginBottom: 16 },
  modalBtns: { flexDirection: 'row', gap: 10 },
});
