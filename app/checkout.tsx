import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as Haptics from 'expo-haptics';
import { Colors } from '../src/constants/colors';
import { Button } from '../src/components/common/Button';
import { Header } from '../src/components/common/Header';
import { useCartStore } from '../src/store/cartStore';
import { createOrder, initPayment } from '../src/api/orders';
import type { PaymentMethod } from '../src/types';

const PAYMENT_OPTIONS = [
  { id: 'stripe' as PaymentMethod, label: 'بطاقة ائتمانية', icon: 'card-outline', desc: 'Visa / Mastercard / Mada' },
  { id: 'tabby' as PaymentMethod, label: 'Tabby', icon: 'calendar-outline', desc: 'اشتر الآن وادفع لاحقاً (4 أقساط)' },
  { id: 'tamara' as PaymentMethod, label: 'Tamara', icon: 'time-outline', desc: 'قسّم على 3 أو 6 دفعات' },
  { id: 'wallet' as PaymentMethod, label: 'المحفظة', icon: 'wallet-outline', desc: 'الدفع من رصيدك' },
];

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, total, promoCode, clearCart } = useCartStore();
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('stripe');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentModal, setPaymentModal] = useState(false);

  const handlePlaceOrder = async () => {
    if (!items.length) return;
    setLoading(true);
    try {
      // Create order
      const order = await createOrder({
        items: items.map((i) => ({ serviceId: i.serviceId, quantity: i.quantity, notes: i.notes })),
        paymentMethod: selectedPayment,
        promoCode: promoCode || undefined,
        notes,
      });

      // Init payment
      if (selectedPayment !== 'wallet') {
        const payment = await initPayment({
          orderId: order.id,
          method: selectedPayment,
          returnUrl: `vera://order/${order.id}`,
        });

        if (payment.paymentUrl) {
          setPaymentUrl(payment.paymentUrl);
          setPaymentModal(true);
          return;
        }
      }

      // Wallet or direct payment
      clearCart();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/order/${order.id}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'حدث خطأ أثناء تقديم الطلب. حاول مجدداً.';
      Alert.alert('خطأ', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleWebViewNav = (navState: { url: string }) => {
    if (navState.url.includes('vera://') || navState.url.includes('success') || navState.url.includes('return')) {
      setPaymentModal(false);
      clearCart();
      router.replace('/(buyer)/orders');
    }
  };

  const t = total();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="إتمام الطلب" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Order Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ملخص الطلب</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemTotal}>{(item.price * item.quantity).toFixed(2)} ر.س</Text>
              <Text style={styles.itemName} numberOfLines={1}>{item.service.title} × {item.quantity}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalAmt}>{t.toFixed(2)} ر.س</Text>
            <Text style={styles.totalLabel}>الإجمالي</Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>طريقة الدفع</Text>
          {PAYMENT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              onPress={() => setSelectedPayment(opt.id)}
              style={[styles.payOption, selectedPayment === opt.id && styles.payOptionActive]}
              activeOpacity={0.8}
            >
              <View style={[styles.radio, selectedPayment === opt.id && styles.radioActive]}>
                {selectedPayment === opt.id && (
                  <View style={styles.radioDot} />
                )}
              </View>
              <View style={styles.payInfo}>
                <Text style={[styles.payLabel, selectedPayment === opt.id && styles.payLabelActive]}>
                  {opt.label}
                </Text>
                <Text style={styles.payDesc}>{opt.desc}</Text>
              </View>
              <View style={[styles.payIconCircle, selectedPayment === opt.id && styles.payIconCircleActive]}>
                <Ionicons name={opt.icon as any} size={22} color={selectedPayment === opt.id ? Colors.primary : Colors.purpleMid} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notes */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ملاحظات (اختياري)</Text>
          <TouchableOpacity
            style={styles.notesInput}
            onPress={() => {}}
          >
            <Text style={styles.notesPlaceholder}>أضف ملاحظات للمزود...</Text>
          </TouchableOpacity>
        </View>

        {/* Security note */}
        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
          <Text style={styles.securityText}>جميع المدفوعات مشفرة وآمنة بالكامل</Text>
        </View>
      </ScrollView>

      {/* Place Order CTA */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          title={`تأكيد الطلب — ${t.toFixed(2)} ر.س`}
          onPress={handlePlaceOrder}
          loading={loading}
          fullWidth
          size="lg"
        />
      </View>

      {/* Payment WebView Modal */}
      <Modal visible={paymentModal} animationType="slide">
        <View style={styles.webviewContainer}>
          <View style={[styles.webviewHeader, { paddingTop: insets.top }]}>
            <TouchableOpacity onPress={() => setPaymentModal(false)}>
              <Ionicons name="close" size={24} color={Colors.purpleDark} />
            </TouchableOpacity>
            <Text style={styles.webviewTitle}>إتمام الدفع</Text>
            <View style={{ width: 24 }} />
          </View>
          {paymentUrl && (
            <WebView
              source={{ uri: paymentUrl }}
              onNavigationStateChange={handleWebViewNav}
              style={{ flex: 1 }}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  card: { margin: 16, marginBottom: 0, marginTop: 16, backgroundColor: Colors.cardBg, borderRadius: 16, padding: 16, shadowColor: Colors.shadowColorDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontFamily: 'Cairo_700Bold', fontSize: 16, color: Colors.textPrimary, textAlign: 'right', marginBottom: 12 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  itemName: { fontFamily: 'Cairo_400Regular', fontSize: 13, color: Colors.textPrimary, flex: 1, textAlign: 'right' },
  itemTotal: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: Colors.purpleDark },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontFamily: 'Cairo_700Bold', fontSize: 16, color: Colors.textPrimary },
  totalAmt: { fontFamily: 'Cairo_700Bold', fontSize: 20, color: Colors.primary },
  payOption: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, marginBottom: 10, gap: 12 },
  payOptionActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}08` },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  payInfo: { flex: 1, alignItems: 'flex-end' },
  payLabel: { fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: Colors.textPrimary },
  payLabelActive: { color: Colors.primary },
  payDesc: { fontFamily: 'Cairo_400Regular', fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  payIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.lightPurple, alignItems: 'center', justifyContent: 'center' },
  payIconCircleActive: { backgroundColor: `${Colors.primary}15` },
  notesInput: { backgroundColor: Colors.lightPurple, borderRadius: 12, padding: 14, minHeight: 70, justifyContent: 'flex-start' },
  notesPlaceholder: { fontFamily: 'Cairo_400Regular', fontSize: 14, color: Colors.textLight, textAlign: 'right' },
  securityNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, margin: 16, marginTop: 12 },
  securityText: { fontFamily: 'Cairo_400Regular', fontSize: 12, color: Colors.textMuted },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: Colors.cardBg, borderTopWidth: 1, borderTopColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 8 },
  webviewContainer: { flex: 1, backgroundColor: Colors.cardBg },
  webviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  webviewTitle: { fontFamily: 'Cairo_700Bold', fontSize: 16, color: Colors.textPrimary },
});
