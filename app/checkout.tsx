import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { hapticNotification } from '../src/utils/haptics';
import { Colors } from '../src/constants/colors';
import { Button } from '../src/components/common/Button';
import { Header } from '../src/components/common/Header';
import { useCartStore } from '../src/store/cartStore';
import { useAuthStore } from '../src/store/authStore';
import { LoginRequired } from '../src/components/common/LoginRequired';
import { cancelOrder, createOrder, initPayment } from '../src/api/orders';
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
  const { buyerUser, buyerToken } = useAuthStore();

  // All hooks must be called before any conditional return (Rules of Hooks)
  const params = useLocalSearchParams<{
    fullName?: string;
    phone?: string;
    city?: string;
    district?: string;
    street?: string;
    buildingNumber?: string;
    notes?: string;
  }>();
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('stripe');
  const [fullName, setFullName] = useState(params.fullName ?? buyerUser?.name ?? '');
  const [phone, setPhone] = useState(params.phone ?? buyerUser?.phone ?? '');
  const [city, setCity] = useState(params.city ?? buyerUser?.city ?? '');
  const [district, setDistrict] = useState(params.district ?? '');
  const [street, setStreet] = useState(params.street ?? '');
  const [buildingNumber, setBuildingNumber] = useState(params.buildingNumber ?? '');
  const [notes, setNotes] = useState(params.notes ?? '');
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const orderTotal = total();

  const address = [city, district, street, buildingNumber ? `مبنى ${buildingNumber}` : '']
    .filter(Boolean)
    .join('، ');

  if (!buyerToken) {
    return <LoginRequired title="تسجيل الدخول مطلوب للدفع" subtitle="سجّل دخولك لإتمام عملية الدفع وتأكيد طلبك" showBack />;
  }

  const handlePlaceOrder = async () => {
    if (!items.length) return;
    const normalizedPhone = phone.replace(/[\s()-]/g, '');
    if (!fullName.trim() || !/^\+?[0-9]{8,15}$/.test(normalizedPhone) ||
        !city.trim() || !district.trim() || !street.trim() || !buildingNumber.trim()) {
      Alert.alert('بيانات التوصيل غير مكتملة', 'ارجع إلى معلومات التوصيل وأكمل جميع الحقول المطلوبة.');
      return;
    }
    setLoading(true);
    let createdOrderId: string | null = null;
    try {
      // إنشاء الطلب في السيرفر أولاً لجميع طرق الدفع —
      // يضمن تتبع الطلب حتى لو أُلغي الدفع أو انقطع الاتصال.
      const createdOrder = await createOrder({
        items: items.map((i) => ({ serviceId: i.serviceId, quantity: i.quantity, notes: i.notes })),
        paymentMethod: selectedPayment,
        promoCode: promoCode || undefined,
        address: address || undefined,
        fullName: fullName.trim(),
        phone: normalizedPhone,
        city: city.trim(),
        district: district.trim(),
        street: street.trim(),
        buildingNumber: buildingNumber.trim(),
        notes,
      });
      const paymentOrderId = createdOrder.id;
      createdOrderId = paymentOrderId;

      if (selectedPayment !== 'wallet') {
        const payment = await initPayment({
          orderId: paymentOrderId,
          method: selectedPayment,
          amount: orderTotal,
          buyerId: buyerUser?.id ?? '',
          address: address || undefined,
          fullName: fullName.trim(),
          phone: normalizedPhone,
          city: city.trim(),
          district: district.trim(),
          street: street.trim(),
          buildingNumber: buildingNumber.trim(),
          returnUrl: `vera://payment/return?orderId=${paymentOrderId}`,
          cancelUrl: `vera://payment/cancel?orderId=${paymentOrderId}`,
        });

        // Only show demo error for non-Stripe methods (Stripe is real)
        if (payment.demo && selectedPayment !== 'stripe') {
          throw new Error(payment.message || 'طريقة الدفع هذه غير مفعلة حاليا.');
        }

        if (payment.paymentUrl) {
          setRedirecting(true);
          // Open payment gateway in system browser; wait for vera:// deep-link redirect
          let result: Awaited<ReturnType<typeof WebBrowser.openAuthSessionAsync>>;
          try {
            result = await WebBrowser.openAuthSessionAsync(
            payment.paymentUrl,
            'vera://payment',
            { createTask: false },
          );
          } finally {
            setRedirecting(false);
          }

          const redirectedUrl =
            result.type === 'success' ? result.url : '';
          const wasSuccess =
            result.type === 'success' &&
            redirectedUrl.includes('vera://payment/return');
          const wasCancelled =
            result.type === 'cancel' ||
            (result.type === 'success' &&
              redirectedUrl.includes('vera://payment/cancel'));

          if (wasCancelled) {
            if (createdOrderId) {
              await cancelOrder(createdOrderId, 'payment_cancelled').catch(() => undefined);
            }
            return; // Stay on checkout screen
          }

          if (wasSuccess) {
            clearCart();
            hapticNotification();
            router.replace(`/order/${paymentOrderId}`);
            return;
          }

          // Browser dismissed without a recognised redirect (user closed manually)
          if (createdOrderId) {
            await cancelOrder(createdOrderId, 'payment_dismissed').catch(() => undefined);
          }
          return;
        }

        throw new Error('لم تُرجع بوابة الدفع رابط دفع صالحا. حاول مرة أخرى.');
      }

      // Wallet payment — no external browser needed
      clearCart();
      hapticNotification();
      router.replace(`/order/${paymentOrderId}`);
    } catch (err: any) {
      if (createdOrderId) {
        await cancelOrder(createdOrderId, 'payment_initialization_failed').catch(() => undefined);
      }
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'حدث خطأ أثناء تقديم الطلب. حاول مجدداً.';
      Alert.alert('خطأ', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="إتمام الطلب" showBack />
      <ScrollView
        keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Order Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ملخص الطلب</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemTotal}>
                {(item.price * item.quantity).toFixed(2)} د.إ
              </Text>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.quantity > 1 ? `${item.quantity}× ` : ''}{item.service.title}
              </Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalAmt}>{orderTotal.toFixed(2)} د.إ</Text>
            <Text style={styles.totalLabel}>الإجمالي</Text>
          </View>
        </View>

        {/* Shipping Address */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>بيانات التوصيل</Text>
          <TextInput
            style={styles.singleLineInput}
            value={fullName}
            onChangeText={setFullName}
            placeholder="الاسم الكامل"
            placeholderTextColor={Colors.textLight}
            textAlign="right"
          />
          <TextInput
            style={styles.singleLineInput}
            value={phone}
            onChangeText={setPhone}
            placeholder="رقم الهاتف"
            placeholderTextColor={Colors.textLight}
            keyboardType="phone-pad"
            textAlign="right"
          />
          <TextInput
            style={styles.singleLineInput}
            value={address}
            editable={false}
            placeholder="العنوان"
            placeholderTextColor={Colors.textLight}
            textAlign="right"
          />
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="ملاحظات التوصيل (اختياري)"
            placeholderTextColor={Colors.textLight}
            multiline
            textAlign="right"
          />
        </View>

        {/* Payment Methods */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>طريقة الدفع</Text>
          {PAYMENT_OPTIONS.map((opt) => {
            const active = selectedPayment === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.payOption, active && styles.payOptionActive]}
                onPress={() => setSelectedPayment(opt.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active && <View style={styles.radioDot} />}
                </View>
                <View style={styles.payInfo}>
                  <Text style={[styles.payLabel, active && styles.payLabelActive]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.payDesc}>{opt.desc}</Text>
                </View>
                <View style={[styles.payIconCircle, active && styles.payIconCircleActive]}>
                  <Ionicons
                    name={opt.icon as any}
                    size={20}
                    color={active ? Colors.primary : Colors.purpleMid}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Security note */}
        <View style={styles.securityNote}>
          <Ionicons name="lock-closed-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.securityText}>الدفع آمن ومشفر بالكامل</Text>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <Button
          title={`ادفع ${orderTotal.toFixed(2)} د.إ`}
          onPress={handlePlaceOrder}
          loading={loading || redirecting}
          disabled={loading || redirecting || !items.length}
          fullWidth
        />
      </View>
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
  notesInput: { backgroundColor: Colors.lightPurple, borderRadius: 12, padding: 14, minHeight: 80, fontFamily: 'Cairo_400Regular', fontSize: 14, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  singleLineInput: { backgroundColor: Colors.lightPurple, borderRadius: 12, padding: 14, minHeight: 48, marginBottom: 10, fontFamily: 'Cairo_400Regular', fontSize: 14, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  securityNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, margin: 16, marginTop: 12 },
  securityText: { fontFamily: 'Cairo_400Regular', fontSize: 12, color: Colors.textMuted },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 40,
    gap: 8,
  },
  progressStep: { alignItems: 'center', gap: 4 },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.lightPurple,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.border,
  },
  stepCircleActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepCircleDone: { backgroundColor: Colors.purpleMid, borderColor: Colors.purpleMid },
  stepNum: { fontFamily: 'Cairo_700Bold', fontSize: 12, color: '#fff' },
  stepLabel: { fontFamily: 'Cairo_400Regular', fontSize: 10, color: Colors.textMuted },
  stepLabelActive: { color: Colors.primary, fontFamily: 'Cairo_700Bold' },
  progressLine: { flex: 1, height: 2, backgroundColor: Colors.border, marginHorizontal: 4, marginBottom: 14 },
  addressDisplay: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'right',
    lineHeight: 22,
  },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: Colors.cardBg, borderTopWidth: 1, borderTopColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 8 },
});
