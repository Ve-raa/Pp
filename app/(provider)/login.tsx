import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { Colors } from '../../src/constants/colors';
import { providerLogin } from '../../src/api/auth';
import { useAuthStore } from '../../src/store/authStore';

export default function ProviderLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loginAsProvider } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'البريد الإلكتروني مطلوب';
    if (!password) e.password = 'كلمة المرور مطلوبة';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await providerLogin({ email: email.trim(), password });
      await loginAsProvider(res.token, res.user as any);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(provider)/dashboard');
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('خطأ', err?.response?.data?.message || 'بيانات غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="briefcase" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.brand}>VÉRA</Text>
          <Text style={styles.tagline}>بوابة مزودي الخدمة</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>دخول مزود الخدمة</Text>
          <Input
            label="البريد الإلكتروني"
            value={email}
            onChangeText={setEmail}
            placeholder="provider@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
            error={errors.email}
          />
          <Input
            label="كلمة المرور"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            isPassword
            leftIcon="lock-closed-outline"
            error={errors.password}
          />
          <Button title="تسجيل الدخول" onPress={handleLogin} loading={loading} fullWidth size="lg" style={{ marginTop: 8 }} />
          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>أو</Text>
            <View style={styles.line} />
          </View>
          <Button
            title="تسجيل كمزود خدمة جديد"
            onPress={() => router.push('/(provider)/register')}
            variant="outline"
            fullWidth
            size="lg"
          />
        </View>

        <TouchableOpacity onPress={() => router.back()} style={styles.backTobuyer}>
          <Ionicons name="person-outline" size={16} color={Colors.purpleMid} />
          <Text style={styles.backTobuyerText}>الدخول كمشتري</Text>
        </TouchableOpacity>

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  header: { alignItems: 'center', marginBottom: 32 },
  logoContainer: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: Colors.lightPurple, alignItems: 'center', justifyContent: 'center',
    marginBottom: 12, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 5,
  },
  brand: { fontFamily: 'Cairo_700Bold', fontSize: 32, color: Colors.primary, letterSpacing: 2 },
  tagline: { fontFamily: 'Cairo_400Regular', fontSize: 14, color: Colors.textMuted, marginTop: 4 },
  card: { backgroundColor: Colors.cardBg, borderRadius: 24, padding: 24, shadowColor: Colors.shadowColorDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  title: { fontFamily: 'Cairo_700Bold', fontSize: 22, color: Colors.textPrimary, textAlign: 'right', marginBottom: 20 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  line: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontFamily: 'Cairo_400Regular', fontSize: 13, color: Colors.textMuted, marginHorizontal: 12 },
  backTobuyer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24, paddingVertical: 12 },
  backTobuyerText: { fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: Colors.purpleMid },
});
