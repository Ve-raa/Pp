import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { Header } from '../../src/components/common/Header';
import { Colors } from '../../src/constants/colors';
import { buyerRegister } from '../../src/api/auth';
import { useAuthStore } from '../../src/store/authStore';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loginAsBuyer } = useAuthStore();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'الاسم مطلوب';
    if (!form.email.trim()) e.email = 'البريد الإلكتروني مطلوب';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'بريد إلكتروني غير صحيح';
    if (!form.password) e.password = 'كلمة المرور مطلوبة';
    else if (form.password.length < 8) e.password = 'يجب أن تكون 8 أحرف على الأقل';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'كلمتا المرور غير متطابقتين';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await buyerRegister({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
      });
      await loginAsBuyer(res.token, res.user as any);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(buyer)');
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err?.response?.data?.message || 'حدث خطأ أثناء إنشاء الحساب';
      Alert.alert('خطأ', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Header title="إنشاء حساب" showBack />
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.subtitle}>أنشئ حسابك وابدأ التسوق الآن</Text>

            <Input
              label="الاسم الكامل"
              value={form.name}
              onChangeText={(v) => set('name', v)}
              placeholder="أحمد محمد"
              leftIcon="person-outline"
              error={errors.name}
            />
            <Input
              label="البريد الإلكتروني"
              value={form.email}
              onChangeText={(v) => set('email', v)}
              placeholder="example@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
              error={errors.email}
            />
            <Input
              label="رقم الجوال (اختياري)"
              value={form.phone}
              onChangeText={(v) => set('phone', v)}
              placeholder="+966 5x xxx xxxx"
              keyboardType="phone-pad"
              leftIcon="call-outline"
            />
            <Input
              label="كلمة المرور"
              value={form.password}
              onChangeText={(v) => set('password', v)}
              placeholder="••••••••"
              isPassword
              leftIcon="lock-closed-outline"
              error={errors.password}
              hint="8 أحرف على الأقل"
            />
            <Input
              label="تأكيد كلمة المرور"
              value={form.confirmPassword}
              onChangeText={(v) => set('confirmPassword', v)}
              placeholder="••••••••"
              isPassword
              leftIcon="lock-closed-outline"
              error={errors.confirmPassword}
            />

            <Text style={styles.terms}>
              بإنشاء حساب، أنت توافق على{' '}
              <Text style={styles.termsLink}>شروط الاستخدام</Text>
              {' '}و{' '}
              <Text style={styles.termsLink}>سياسة الخصوصية</Text>
            </Text>

            <Button
              title="إنشاء الحساب"
              onPress={handleRegister}
              loading={loading}
              fullWidth
              size="lg"
              style={{ marginTop: 8 }}
            />
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
  terms: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 4,
  },
  termsLink: { color: Colors.primary, fontFamily: 'Cairo_600SemiBold' },
});
