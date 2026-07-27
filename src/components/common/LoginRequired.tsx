import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Button } from './Button';

interface LoginRequiredProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
}

export function LoginRequired({
  title = 'تسجيل الدخول مطلوب',
  subtitle = 'سجّل دخولك للوصول إلى هذه الصفحة والاستمتاع بجميع المميزات',
  showBack = false,
}: LoginRequiredProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {showBack && (
        <TouchableOpacity style={[styles.backBtn, { top: insets.top + 4 }]} onPress={() => router.back()}>
          <Ionicons name="chevron-forward" size={24} color={Colors.purpleDark} />
        </TouchableOpacity>
      )}

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed-outline" size={52} color={Colors.primary} />
        </View>

        {/* Brand */}
        <Text style={styles.brand}>VÉRA</Text>

        {/* Texts */}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {/* Buttons */}
        <View style={styles.actions}>
          <Button
            title="تسجيل الدخول"
            onPress={() => router.push('/(auth)/login')}
            fullWidth
            size="lg"
            style={styles.loginBtn}
          />
          <Button
            title="إنشاء حساب جديد"
            onPress={() => router.push('/(auth)/register')}
            variant="outline"
            fullWidth
            size="lg"
          />
        </View>

        {/* Continue browsing */}
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => {
            try { router.push('/(buyer)'); } catch { /* ignore */ }
          }}
        >
          <Text style={styles.skipText}>متابعة التصفح بدون تسجيل</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backBtn: {
    position: 'absolute',
    top: 0,
    right: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.lightPurple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  brand: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 28,
    color: Colors.primary,
    letterSpacing: 2,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 22,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  loginBtn: {
    marginBottom: 0,
  },
  skipBtn: {
    marginTop: 24,
    paddingVertical: 8,
  },
  skipText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
});
