/**
 * صفحة معلومات الشحن — الخطوة 1 من عملية الدفع
 * يُعبّأ فيها عنوان التوصيل والملاحظات ثم ينتقل المستخدم لصفحة الدفع
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';
import { Button } from '../src/components/common/Button';
import { Header } from '../src/components/common/Header';
import { useCartStore } from '../src/store/cartStore';
import { useAuthStore } from '../src/store/authStore';

export default function ShippingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, total } = useCartStore();
  const { buyerUser } = useAuthStore();
  const [fullName, setFullName] = useState(buyerUser?.name ?? '');
  const [phone, setPhone] = useState(buyerUser?.phone ?? '');
  const [city, setCity] = useState(buyerUser?.city ?? '');
  const [district, setDistrict] = useState('');
  const [street, setStreet] = useState('');
  const [buildingNumber, setBuildingNumber] = useState('');
  const [notes, setNotes] = useState('');
  const orderTotal = total();

  const handleContinue = () => {
    const normalizedPhone = phone.replace(/[\s()-]/g, '');
    if (!fullName.trim() || !/^\+?[0-9]{8,15}$/.test(normalizedPhone)) {
      Alert.alert('بيانات غير مكتملة', 'أدخل الاسم الكامل ورقم هاتف صحيحاً (من 8 إلى 15 رقماً).');
      return;
    }
    if (!city.trim() || !district.trim() || !street.trim() || !buildingNumber.trim()) {
      Alert.alert('العنوان غير مكتمل', 'أدخل المدينة والحي والشارع ورقم المبنى للمتابعة.');
      return;
    }

    try {
      router.push({
        pathname: '/checkout',
        params: {
          fullName: fullName.trim(),
          phone: normalizedPhone,
          city: city.trim(),
          district: district.trim(),
          street: street.trim(),
          buildingNumber: buildingNumber.trim(),
          notes: notes.trim(),
        },
      });
    } catch {
      Alert.alert('تعذّر المتابعة', 'حدث خطأ أثناء حفظ معلومات التوصيل. حاول مرة أخرى.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <Header title="معلومات التوصيل" showBack />

        {/* شريط التقدم */}
        <View style={styles.progressBar}>
          <View style={styles.progressStep}>
            <View style={[styles.stepCircle, styles.stepCircleActive]}>
              <Text style={styles.stepNum}>1</Text>
            </View>
            <Text style={[styles.stepLabel, styles.stepLabelActive]}>التوصيل</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={styles.stepCircle}>
              <Text style={[styles.stepNum, styles.stepNumInactive]}>2</Text>
            </View>
            <Text style={styles.stepLabel}>الدفع</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ملخص الطلب */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>ملخص الطلب</Text>
            {items.map((item) => (
              <View key={item.serviceId} style={styles.itemRow}>
                <Text style={styles.itemQty}>x{item.quantity}</Text>
                <Text style={styles.itemName} numberOfLines={1}>{item.service?.title ?? 'خدمة'}</Text>
                <Text style={styles.itemPrice}>
                  {(item.price * item.quantity).toFixed(2)} د.إ
                </Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalAmt}>{orderTotal.toFixed(2)} د.إ</Text>
              <Text style={styles.totalLabel}>الإجمالي</Text>
            </View>
          </View>

          {/* بيانات المستلم */}
          <View style={styles.card}>
            <View style={styles.fieldHeader}>
              <Ionicons name="person-outline" size={18} color={Colors.primary} />
              <Text style={styles.cardTitle}>بيانات المستلم</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="الاسم الكامل"
              placeholderTextColor={Colors.textLight}
              value={fullName}
              onChangeText={setFullName}
              textAlign="right"
              returnKeyType="next"
            />
            <TextInput
              style={styles.input}
              placeholder="رقم الهاتف"
              placeholderTextColor={Colors.textLight}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              textAlign="right"
              returnKeyType="next"
              maxLength={16}
            />
          </View>

          {/* العنوان المهيكل */}
          <View style={styles.card}>
            <View style={styles.fieldHeader}>
              <Ionicons name="location-outline" size={18} color={Colors.primary} />
              <Text style={styles.cardTitle}>عنوان التوصيل</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="المدينة"
              placeholderTextColor={Colors.textLight}
              value={city}
              onChangeText={setCity}
              textAlign="right"
              returnKeyType="next"
            />
            <TextInput
              style={styles.input}
              placeholder="الحي"
              placeholderTextColor={Colors.textLight}
              value={district}
              onChangeText={setDistrict}
              textAlign="right"
              returnKeyType="next"
            />
            <TextInput
              style={styles.input}
              placeholder="الشارع"
              placeholderTextColor={Colors.textLight}
              value={street}
              onChangeText={setStreet}
              textAlign="right"
              returnKeyType="next"
            />
            <TextInput
              style={styles.input}
              placeholder="رقم المبنى"
              placeholderTextColor={Colors.textLight}
              value={buildingNumber}
              onChangeText={setBuildingNumber}
              keyboardType="number-pad"
              textAlign="right"
              returnKeyType="done"
              maxLength={10}
            />
          </View>

          {/* ملاحظات إضافية */}
          <View style={styles.card}>
            <View style={styles.fieldHeader}>
              <Ionicons name="chatbubble-outline" size={18} color={Colors.primary} />
              <Text style={styles.cardTitle}>ملاحظات إضافية (اختياري)</Text>
            </View>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="أي تعليمات خاصة للمزود..."
              placeholderTextColor={Colors.textLight}
              value={notes}
              onChangeText={setNotes}
              textAlign="right"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        {/* زر المتابعة */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
          <Button
            title="التالي — اختيار طريقة الدفع"
            onPress={handleContinue}
            fullWidth
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  // Progress bar
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 40,
    gap: 8,
  },
  progressStep: { alignItems: 'center', gap: 4 },
  stepCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.lightPurple,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.border,
  },
  stepCircleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepNum: { fontFamily: 'Cairo_700Bold', fontSize: 13, color: '#fff' },
  stepNumInactive: { color: Colors.textMuted },
  stepLabel: { fontFamily: 'Cairo_400Regular', fontSize: 11, color: Colors.textMuted },
  stepLabelActive: { color: Colors.primary, fontFamily: 'Cairo_700Bold' },
  progressLine: {
    flex: 1, height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 8, marginBottom: 16,
  },
  // Content
  content: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: Colors.shadowColorDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 15,
    color: Colors.textPrimary,
    textAlign: 'right',
    marginBottom: 10,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemQty: { fontFamily: 'Cairo_400Regular', fontSize: 12, color: Colors.textMuted, minWidth: 24 },
  itemName: { fontFamily: 'Cairo_400Regular', fontSize: 13, color: Colors.textPrimary, flex: 1, textAlign: 'right', marginHorizontal: 8 },
  itemPrice: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: Colors.purpleDark },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontFamily: 'Cairo_700Bold', fontSize: 16, color: Colors.textPrimary },
  totalAmt: { fontFamily: 'Cairo_700Bold', fontSize: 20, color: Colors.primary },
  // Inputs
  input: {
    backgroundColor: Colors.lightPurple,
    borderRadius: 12,
    padding: 14,
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 48,
    marginBottom: 10,
  },
  notesInput: { minHeight: 70 },
  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: 16,
    backgroundColor: Colors.cardBg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
});
