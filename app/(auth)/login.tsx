import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { hapticNotification } from '../../src/utils/haptics';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { Colors } from '../../src/constants/colors';
import { buyerLogin } from '../../src/api/auth';
import { useAuthStore } from '../../src/store/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loginAsBuyer } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'البريد الإلكتروني مطلوب';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'بريد إلكتروني غير صحيح';
    if (!password) e.password = 'كلمة المرور مطلوبة';
    else if (password.length < 8) e.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await buyerLogin({ email: email.trim(), password });
      await loginAsBuyer(res.token, res.user as any);
      hapticNotification();
      router.replace('/(buyer)');
    } catch (err: any) {
      hapticNotification('error');
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        (err?.request ? 'تعذر الاتصال بالخادم. تحقق من اتصالك وحاول مرة أخرى.' : null) ||
        'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      Alert.alert('خطأ في تسجيل الدخول', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="sparkles" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.brand}>VÉRA</Text>
          <Text style={styles.tagline}>منصة الخدمات المنزلية في الخليج</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.title}>تسجيل الدخول</Text>
          <Text style={styles.subtitle}>مرحباً بعودتك 👋</Text>

          <Input
            label="البريد الإلكتروني"
            value={email}
            onChangeText={setEmail}
            placeholder="example@email.com"
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

          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password')}
            style={styles.forgotBtn}
          >
            <Text style={styles.forgotText}>نسيت كلمة المرور؟</Text>
          </TouchableOpacity>

          <Button
            title="تسجيل الدخول"
            onPress={handleLogin}
            loading={loading}
            fullWidth
            size="lg"
            style={styles.loginBtn}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>أو</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            title="إنشاء حساب جديد"
            onPress={() => router.push('/(auth)/register')}
            variant="outline"
            fullWidth
            size="lg"
          />
        </View>

        {/* Provider Banner — dark & prominent */}
        <TouchableOpacity
          style={styles.providerBanner}
          onPress={() => router.push('/(provider)/login')}
          activeOpacity={0.85}
        >
          <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.5)" />
          <View style={styles.providerBannerBody}>
            <Text style={styles.providerBannerTitle}>هل تقدم خدمات منزلية؟</Text>
            <Text style={styles.providerBannerSub}>سجّل دخولك كمزود خدمة</Text>
          </View>
          <View style={styles.providerBannerIcon}>
            <Ionicons name="briefcase" size={26} color="#fff" />
          </View>
        </TouchableOpacity>

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
    marginBottom: 12, shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5,
  },
  brand: { fontFamily: 'Cairo_700Bold', fontSize: 32, color: Colors.primary, letterSpacing: 2 },
  tagline: { fontFamily: 'Cairo_400Regular', fontSize: 14, color: Colors.textMuted, marginTop: 4 },

  card: {
    backgroundColor: Colors.cardBg, borderRadius: 24, padding: 24,
    shadowColor: Colors.shadowColorDark, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  title: { fontFamily: 'Cairo_700Bold', fontSize: 24, color: Colors.textPrimary, textAlign: 'right', marginBottom: 4 },
  subtitle: { fontFamily: 'Cairo_400Regular', fontSize: 14, color: Colors.textMuted, textAlign: 'right', marginBottom: 24 },
  forgotBtn: { alignSelf: 'flex-start', marginBottom: 20, marginTop: -8 },
  forgotText: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: Colors.primary },
  loginBtn: { marginBottom: 20 },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontFamily: 'Cairo_400Regular', fontSize: 13, color: Colors.textMuted, marginHorizontal: 12 },

  providerBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.purpleDeep,
    borderRadius: 20, marginTop: 16,
    paddingVertical: 18, paddingHorizontal: 18, gap: 12,
    shadowColor: Colors.purpleDeep,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 7,
  },
  providerBannerIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  providerBannerBody: { flex: 1, alignItems: 'flex-end' },
  providerBannerTitle: { fontFamily: 'Cairo_700Bold', fontSize: 15, color: '#fff', textAlign: 'right' },
  providerBannerSub: { fontFamily: 'Cairo_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.6)', textAlign: 'right', marginTop: 2 },
});
