import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Alert, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../src/constants/colors';
import { Button } from '../../src/components/common/Button';
import { EmptyState } from '../../src/components/common/EmptyState';
import { useCartStore } from '../../src/store/cartStore';

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    items, subtotal, total, promoCode, promoDiscount, promoType,
    updateQuantity, removeItem, setPromo, removePromo, clearCart,
  } = useCartStore();
  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    try {
      const { applyPromoCode } = await import('../../src/api/cart');
      const res = await applyPromoCode(promoInput.trim());
      if (res.isValid) {
        setPromo(res.code, res.discount, res.type);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert('كود غير صالح', res.message || 'الكود المدخل غير صحيح أو منتهي الصلاحية');
      }
    } catch {
      Alert.alert('خطأ', 'تعذّر التحقق من الكود. حاول مجدداً.');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemoveItem = (id: string, name: string) => {
    Alert.alert('حذف', `هل تريد حذف "${name}" من السلة؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: () => {
          removeItem(id);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
      },
    ]);
  };

  const s = subtotal();
  const t = total();
  const discount = s - t;

  if (items.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>سلة التسوق</Text>
        </View>
        <EmptyState
          icon="bag-outline"
          title="السلة فارغة"
          subtitle="لم تضف أي خدمات بعد. تصفح الخدمات وأضفها إلى سلتك."
          actionLabel="تسوق الآن"
          onAction={() => router.push('/(buyer)')}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => Alert.alert('تنبيه', 'هل تريد تفريغ السلة؟', [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'تفريغ', style: 'destructive', onPress: clearCart },
        ])}>
          <Text style={styles.clearText}>تفريغ</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>السلة ({items.length})</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <Image
              source={{ uri: item.service.image || item.service.images?.[0] }}
              style={styles.itemImage}
            />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>{item.service.title}</Text>
              <Text style={styles.itemPrice}>{item.price} ر.س</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  onPress={() => updateQuantity(item.serviceId, item.quantity + 1)}
                  style={styles.qtyBtn}
                >
                  <Ionicons name="add" size={16} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.qty}>{item.quantity}</Text>
                <TouchableOpacity
                  onPress={() => updateQuantity(item.serviceId, item.quantity - 1)}
                  style={styles.qtyBtn}
                >
                  <Ionicons name="remove" size={16} color={Colors.purpleMid} />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => handleRemoveItem(item.serviceId, item.service.title)}
              style={styles.deleteBtn}
            >
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={
          <View>
            {/* Promo code */}
            <View style={styles.promoSection}>
              <Text style={styles.promoLabel}>كود الخصم</Text>
              {promoCode ? (
                <View style={styles.promoApplied}>
                  <TouchableOpacity onPress={removePromo}>
                    <Ionicons name="close-circle" size={20} color={Colors.error} />
                  </TouchableOpacity>
                  <Text style={styles.promoAppliedText}>
                    ✅ تم تطبيق "{promoCode}" — خصم {promoDiscount}{promoType === 'percentage' ? '%' : ' ر.س'}
                  </Text>
                </View>
              ) : (
                <View style={styles.promoRow}>
                  <Button
                    title="تطبيق"
                    onPress={handleApplyPromo}
                    loading={promoLoading}
                    size="sm"
                    style={styles.promoBtn}
                  />
                  <TextInput
                    style={styles.promoInput}
                    placeholder="أدخل كود الخصم"
                    placeholderTextColor={Colors.textLight}
                    value={promoInput}
                    onChangeText={setPromoInput}
                    autoCapitalize="characters"
                    textAlign="right"
                  />
                </View>
              )}
            </View>

            {/* Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>ملخص الطلب</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryValue}>{s.toFixed(2)} ر.س</Text>
                <Text style={styles.summaryLabel}>المجموع الفرعي</Text>
              </View>
              {discount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryValue, { color: Colors.success }]}>
                    -{discount.toFixed(2)} ر.س
                  </Text>
                  <Text style={styles.summaryLabel}>الخصم</Text>
                </View>
              )}
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={styles.totalValue}>{t.toFixed(2)} ر.س</Text>
                <Text style={styles.totalLabel}>الإجمالي</Text>
              </View>
            </View>

            <Button
              title={`الدفع — ${t.toFixed(2)} ر.س`}
              onPress={() => router.push('/checkout')}
              fullWidth
              size="lg"
              style={styles.checkoutBtn}
            />
            <View style={{ height: 100 }} />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.cardBg,
  },
  headerTitle: { fontFamily: 'Cairo_700Bold', fontSize: 18, color: Colors.textPrimary },
  clearText: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: Colors.error },
  list: { paddingHorizontal: 16, paddingTop: 12 },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    gap: 12,
    shadowColor: Colors.shadowColorDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  itemImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: Colors.lightPurple },
  itemInfo: { flex: 1, justifyContent: 'space-between' },
  itemName: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: Colors.textPrimary, textAlign: 'right' },
  itemPrice: { fontFamily: 'Cairo_700Bold', fontSize: 15, color: Colors.primary, textAlign: 'right' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'flex-end' },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.lightPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: { fontFamily: 'Cairo_700Bold', fontSize: 15, color: Colors.textPrimary, minWidth: 20, textAlign: 'center' },
  deleteBtn: { padding: 4 },
  promoSection: { marginBottom: 16 },
  promoLabel: { fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: Colors.textPrimary, textAlign: 'right', marginBottom: 8 },
  promoRow: { flexDirection: 'row', gap: 10 },
  promoInput: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  promoBtn: { alignSelf: 'center' },
  promoApplied: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.successLight, padding: 12, borderRadius: 12 },
  promoAppliedText: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: Colors.success, flex: 1, textAlign: 'right' },
  summaryCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.shadowColorDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: { fontFamily: 'Cairo_700Bold', fontSize: 16, color: Colors.textPrimary, textAlign: 'right', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontFamily: 'Cairo_400Regular', fontSize: 14, color: Colors.textMuted },
  summaryValue: { fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: Colors.textPrimary },
  summaryTotal: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12, marginTop: 4 },
  totalLabel: { fontFamily: 'Cairo_700Bold', fontSize: 16, color: Colors.textPrimary },
  totalValue: { fontFamily: 'Cairo_700Bold', fontSize: 18, color: Colors.primary },
  checkoutBtn: { marginBottom: 0 },
});
