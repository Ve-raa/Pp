import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform,
  TouchableOpacity, Modal, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { hapticNotification } from '../../src/utils/haptics';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { Header } from '../../src/components/common/Header';
import { Colors } from '../../src/constants/colors';
import { providerRegister } from '../../src/api/auth';
import { useAuthStore } from '../../src/store/authStore';

// ─── Countries list (MENA + common) ──────────────────────────────────────────
const COUNTRIES = [
  { code: 'AE', name: 'الإمارات العربية المتحدة' },
  { code: 'SA', name: 'المملكة العربية السعودية' },
  { code: 'KW', name: 'الكويت' },
  { code: 'BH', name: 'البحرين' },
  { code: 'QA', name: 'قطر' },
  { code: 'OM', name: 'عُمان' },
  { code: 'EG', name: 'مصر' },
  { code: 'JO', name: 'الأردن' },
  { code: 'LB', name: 'لبنان' },
  { code: 'IQ', name: 'العراق' },
  { code: 'YE', name: 'اليمن' },
  { code: 'SY', name: 'سوريا' },
  { code: 'PS', name: 'فلسطين' },
  { code: 'LY', name: 'ليبيا' },
  { code: 'TN', name: 'تونس' },
  { code: 'MA', name: 'المغرب' },
  { code: 'DZ', name: 'الجزائر' },
  { code: 'SD', name: 'السودان' },
  { code: 'TR', name: 'تركيا' },
  { code: 'GB', name: 'المملكة المتحدة' },
  { code: 'US', name: 'الولايات المتحدة' },
  { code: 'DE', name: 'ألمانيا' },
  { code: 'FR', name: 'فرنسا' },
];

function getCountryName(code: string): string {
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
}

export default function ProviderRegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loginAsProvider } = useAuthStore();
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    businessName: '', country: 'AE', city: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'الاسم مطلوب';
    if (!form.email.trim()) e.email = 'البريد الإلكتروني مطلوب';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'بريد إلكتروني غير صحيح';
    if (form.password.length < 8) e.password = 'يجب أن تكون 8 أحرف على الأقل';
    if (!form.phone.trim()) e.phone = 'رقم الجوال مطلوب';
    if (!form.businessName.trim()) e.businessName = 'اسم النشاط مطلوب';
    if (!form.city.trim()) e.city = 'المدينة مطلوبة';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await providerRegister({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        businessName: form.businessName.trim(),
        country: form.country,
        city: form.city.trim(),
      });
      await loginAsProvider(res.token, res.user as any);
      hapticNotification();
      router.replace('/(provider)/dashboard');
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        (err?.request ? 'تعذر الاتصال بالخادم. تحقق من اتصالك وحاول مرة أخرى.' : null) ||
        'حدث خطأ أثناء التسجيل';
      Alert.alert('خطأ', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <Header title="تسجيل مزود خدمة" showBack />
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
              <Text style={styles.subtitle}>انضم كمزود خدمة وابدأ في استقبال الطلبات</Text>
              <Input label="الاسم الكامل" value={form.name} onChangeText={(v) => set('name', v)} placeholder="محمد أحمد" leftIcon="person-outline" error={errors.name} />
              <Input label="البريد الإلكتروني" value={form.email} onChangeText={(v) => set('email', v)} placeholder="email@example.com" keyboardType="email-address" autoCapitalize="none" leftIcon="mail-outline" error={errors.email} />
              <Input label="رقم الجوال" value={form.phone} onChangeText={(v) => set('phone', v)} placeholder="+971 5x xxx xxxx" keyboardType="phone-pad" leftIcon="call-outline" error={errors.phone} />
              <Input label="اسم النشاط التجاري" value={form.businessName} onChangeText={(v) => set('businessName', v)} placeholder="شركة / مؤسسة / اسم تجاري" leftIcon="briefcase-outline" error={errors.businessName} />

              {/* ── Country Picker ──────────────────────────────────────── */}
              <Text style={styles.fieldLabel}>الدولة</Text>
              <TouchableOpacity
                style={styles.countryPicker}
                onPress={() => setShowCountryPicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-down-outline" size={16} color={Colors.textMuted} />
                <View style={{ flex: 1 }} />
                <Text style={styles.countryPickerText}>{getCountryName(form.country)}</Text>
                <Ionicons name="location-outline" size={18} color={Colors.primary} />
              </TouchableOpacity>

              <Input label="المدينة" value={form.city} onChangeText={(v) => set('city', v)} placeholder="دبي، أبوظبي، الرياض..." leftIcon="location-outline" error={errors.city} />
              <Input label="كلمة المرور" value={form.password} onChangeText={(v) => set('password', v)} placeholder="••••••••" isPassword leftIcon="lock-closed-outline" error={errors.password} hint="8 أحرف على الأقل" />
              <Button title="إنشاء حساب مزود الخدمة" onPress={handleRegister} loading={loading} fullWidth size="lg" style={{ marginTop: 8 }} />
            </View>
            <View style={{ height: insets.bottom + 20 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* ── Country Picker Modal ──────────────────────────────────────────── */}
      <Modal
        visible={showCountryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCountryPicker(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>اختر الدولة</Text>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryItem,
                    form.country === item.code && styles.countryItemActive,
                  ]}
                  onPress={() => {
                    set('country', item.code);
                    setShowCountryPicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  {form.country === item.code && (
                    <Ionicons name="checkmark" size={18} color={Colors.primary} />
                  )}
                  <Text
                    style={[
                      styles.countryItemText,
                      form.country === item.code && styles.countryItemTextActive,
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text style={styles.countryCode}>{item.code}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingTop: 16 },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 24,
    padding: 24,
    shadowColor: Colors.shadowColorDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  subtitle: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'right',
    marginBottom: 20,
  },
  fieldLabel: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
    textAlign: 'right',
    marginBottom: 6,
    marginTop: 4,
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 16,
    gap: 8,
  },
  countryPickerText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '75%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 17,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  countryItemActive: {
    backgroundColor: `${Colors.primary}0A`,
    borderRadius: 10,
    borderBottomColor: 'transparent',
    paddingHorizontal: 8,
  },
  countryItemText: {
    flex: 1,
    fontFamily: 'Cairo_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  countryItemTextActive: {
    fontFamily: 'Cairo_600SemiBold',
    color: Colors.primary,
  },
  countryCode: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    minWidth: 30,
  },
});
