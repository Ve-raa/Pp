import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors } from '../../src/constants/colors';
import { Header } from '../../src/components/common/Header';
import { Button } from '../../src/components/common/Button';
import { createProviderService } from '../../src/api/provider';
import { useAuthStore } from '../../src/store/authStore';

export default function AddServiceScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { providerUser, providerToken, isLoading } = useAuthStore();

  // ── حماية: انتظر انتهاء التحقق من الجلسة قبل أي إعادة توجيه ─────────────
  useEffect(() => {
    if (isLoading) return;
    if (!providerToken) {
      try {
        router.replace('/(provider)/login');
      } catch {
        // ignore
      }
    }
  }, [isLoading, providerToken]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    deliveryTime: '',
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const createMutation = useMutation({
    mutationFn: async () => {
      const title = form.title.trim();
      const price = parseFloat(form.price);
      if (!title) throw new Error('VALIDATION_TITLE');
      if (isNaN(price) || price <= 0) throw new Error('VALIDATION_PRICE');
      return createProviderService({
        title,
        description: form.description.trim(),
        price,
        deliveryTime: form.deliveryTime.trim(),
        images: [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-services'] });
      Alert.alert('تمت الإضافة ✅', 'تم إضافة الخدمة بنجاح', [
        {
          text: 'حسناً',
          onPress: () => {
            try {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(provider)/services');
              }
            } catch {
              // ignore
            }
          },
        },
      ]);
    },
    onError: (error: any) => {
      const msg = error?.message ?? '';
      if (msg === 'VALIDATION_TITLE') {
        Alert.alert('تنبيه', 'يرجى إدخال عنوان الخدمة');
        return;
      }
      if (msg === 'VALIDATION_PRICE') {
        Alert.alert('تنبيه', 'يرجى إدخال سعر صحيح أكبر من صفر');
        return;
      }
      const status = error?.response?.status;
      if (status === 401) {
        try { router.replace('/(provider)/login'); } catch { /* ignore */ }
      } else if (status === 422 || status === 400) {
        Alert.alert('بيانات غير صحيحة', 'تحقق من جميع الحقول وحاول مجدداً');
      } else if (status === 500) {
        Alert.alert('خطأ في الخادم', 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً');
      } else {
        Alert.alert('خطأ', 'تعذّر إضافة الخدمة. يرجى المحاولة مجدداً');
      }
    },
  });

  const handleSubmit = () => {
    const trimmedTitle = form.title.trim();
    const priceNum = parseFloat(form.price);
    if (!trimmedTitle) {
      Alert.alert('تنبيه', 'يرجى إدخال عنوان الخدمة');
      return;
    }
    if (!form.price || isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('تنبيه', 'يرجى إدخال سعر صحيح أكبر من صفر');
      return;
    }
    createMutation.mutate();
  };

  // ── عرض مؤشر التحميل أثناء التحقق من الجلسة ─────────────────────────────
  if (isLoading || !providerToken || !providerUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Header title="إضافة خدمة جديدة" showBack />
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>عنوان الخدمة *</Text>
          <TextInput
            style={styles.input}
            value={form.title}
            onChangeText={(v) => set('title', v)}
            placeholder="مثال: تنظيف منزلي شامل"
            placeholderTextColor={Colors.textLight}
            textAlign="right"
            maxLength={120}
          />

          <Text style={styles.label}>وصف الخدمة</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.description}
            onChangeText={(v) => set('description', v)}
            placeholder="اشرح تفاصيل ما تقدمه..."
            placeholderTextColor={Colors.textLight}
            multiline
            numberOfLines={4}
            textAlign="right"
            maxLength={500}
          />

          <Text style={styles.label}>السعر (د.إ) *</Text>
          <TextInput
            style={styles.input}
            value={form.price}
            onChangeText={(v) => set('price', v)}
            placeholder="مثال: 150"
            placeholderTextColor={Colors.textLight}
            keyboardType="decimal-pad"
            textAlign="right"
          />

          <Text style={styles.label}>مدة التسليم</Text>
          <TextInput
            style={styles.input}
            value={form.deliveryTime}
            onChangeText={(v) => set('deliveryTime', v)}
            placeholder="مثال: 2-3 أيام"
            placeholderTextColor={Colors.textLight}
            textAlign="right"
          />

          <View style={styles.btnWrapper}>
            <Button
              title="إضافة الخدمة"
              onPress={handleSubmit}
              loading={createMutation.isPending}
              disabled={createMutation.isPending}
              fullWidth
            />
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 60 },
  label: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
    textAlign: 'right',
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    padding: 14,
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  btnWrapper: { marginTop: 8 },
});
