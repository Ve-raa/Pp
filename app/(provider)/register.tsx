import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { Header } from '../../src/components/common/Header';
import { Colors } from '../../src/constants/colors';
import { providerRegister } from '../../src/api/auth';
import { useAuthStore } from '../../src/store/authStore';

export default function ProviderRegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loginAsProvider } = useAuthStore();
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    businessName: '', country: 'SA', city: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'الاسم مطلوب';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'بريد إلكتروني غير صحيح';
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(provider)/dashboard');
    } catch (err: any) {
      Alert.alert('خطأ', err?.response?.data?.message || 'حدث خطأ أثناء التسجيل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Header title="تسجيل مزود خدمة" showBack />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.subtitle}>انضم كمزود خدمة وابدأ في استقبال الطلبات</Text>
            <Input label="الاسم الكامل" value={form.name} onChangeText={(v) => set('name', v)} placeholder="محمد أحمد" leftIcon="person-outline" error={errors.name} />
            <Input label="البريد الإلكتروني" value={form.email} onChangeText={(v) => set('email', v)} placeholder="email@example.com" keyboardType="email-address" autoCapitalize="none" leftIcon="mail-outline" error={errors.email} />
            <Input label="رقم الجوال" value={form.phone} onChangeText={(v) => set('phone', v)} placeholder="+966 5x xxx xxxx" keyboardType="phone-pad" leftIcon="call-outline" error={errors.phone} />
            <Input label="اسم النشاط التجاري" value={form.businessName} onChangeText={(v) => set('businessName', v)} placeholder="شركة / مؤسسة / اسم تجاري" leftIcon="briefcase-outline" error={errors.businessName} />
            <Input label="المدينة" value={form.city} onChangeText={(v) => set('city', v)} placeholder="الرياض، جدة، دبي..." leftIcon="location-outline" error={errors.city} />
            <Input label="كلمة المرور" value={form.password} onChangeText={(v) => set('password', v)} placeholder="••••••••" isPassword leftIcon="lock-closed-outline" error={errors.password} hint="8 أحرف على الأقل" />
            <Button title="إنشاء حساب مزود الخدمة" onPress={handleRegister} loading={loading} fullWidth size="lg" style={{ marginTop: 8 }} />
          </View>
          <View style={{ height: insets.bottom + 20 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingTop: 16 },
  card: { backgroundColor: Colors.cardBg, borderRadius: 24, padding: 24, shadowColor: Colors.shadowColorDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  subtitle: { fontFamily: 'Cairo_400Regular', fontSize: 14, color: Colors.textMuted, textAlign: 'right', marginBottom: 20 },
});
