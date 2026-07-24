import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { Header } from '../../src/components/common/Header';
import { Colors } from '../../src/constants/colors';
import { buyerForgotPassword } from '../../src/api/auth';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) return Alert.alert('تنبيه', 'أدخل البريد الإلكتروني');
    setLoading(true);
    try {
      await buyerForgotPassword(email.trim());
      setSent(true);
    } catch {
      Alert.alert('خطأ', 'تعذّر إرسال رابط إعادة التعيين. تحقق من البريد الإلكتروني.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="استعادة كلمة المرور" showBack />
      <ScrollView contentContainerStyle={styles.content}>
        {sent ? (
          <View style={styles.successCard}>
            <Text style={styles.successIcon}>📧</Text>
            <Text style={styles.successTitle}>تم الإرسال!</Text>
            <Text style={styles.successText}>
              تحقق من بريدك الإلكتروني واتبع التعليمات لإعادة تعيين كلمة المرور.
            </Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.desc}>
              أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.
            </Text>
            <Input
              label="البريد الإلكتروني"
              value={email}
              onChangeText={setEmail}
              placeholder="example@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
            />
            <Button title="إرسال الرابط" onPress={handleSend} loading={loading} fullWidth size="lg" />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingTop: 24 },
  card: { backgroundColor: Colors.cardBg, borderRadius: 20, padding: 24 },
  desc: { fontFamily: 'Cairo_400Regular', fontSize: 14, color: Colors.textMuted, textAlign: 'right', marginBottom: 20, lineHeight: 24 },
  successCard: { backgroundColor: Colors.cardBg, borderRadius: 20, padding: 32, alignItems: 'center' },
  successIcon: { fontSize: 60, marginBottom: 16 },
  successTitle: { fontFamily: 'Cairo_700Bold', fontSize: 22, color: Colors.textPrimary, marginBottom: 12 },
  successText: { fontFamily: 'Cairo_400Regular', fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 24 },
});
