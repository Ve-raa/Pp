import React, { useState, Component, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors } from '../../src/constants/colors';
import { Header } from '../../src/components/common/Header';
import { Button } from '../../src/components/common/Button';
import { createProviderService } from '../../src/api/provider';
import { useAuthStore } from '../../src/store/authStore';

// ─── Error Boundary ───────────────────────────────────────────────────────────
interface EBState { hasError: boolean; message: string }
class ScreenErrorBoundary extends Component<
  { children: React.ReactNode },
  EBState
> {
  state: EBState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, message: error?.message ?? 'خطأ غير متوقع' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errStyles.container}>
          <Text style={errStyles.title}>تعذّر فتح هذه الشاشة</Text>
          <Text style={errStyles.msg}>{this.state.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const errStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  msg: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
function AddServiceContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { providerUser, providerToken, isLoading } = useAuthStore();

  // ── حماية: إعادة التوجيه إذا لم يكن مسجّلاً كمزود ────────────────────────
  const isRedirectingRef = React.useRef(false);

  useEffect(() => {
    if (isLoading) return;
    if (!providerToken && !isRedirectingRef.current) {
      isRedirectingRef.current = true;
      const t = setTimeout(() => {
        try {
          router.replace('/(provider)/login');
        } catch {
          // ignore — قد تكون الشاشة unmounted
        }
      }, 50);
      return () => clearTimeout(t);
    }
  }, [providerToken, router]);

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
      // validate locally before calling API to avoid unnecessary crashes
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
        // الجلسة منتهية — المعالج في client.ts سيتولى إعادة التوجيه تلقائياً
        // لا تتخذ أي إجراء إضافي هنا لتجنب التنقل المزدوج
        return;
      } else if (status === 422 || status === 400) {
        Alert.alert('بيانات غير صحيحة', 'تحقق من جميع الحقول وحاول مجدداً');
      } else if (status === 500) {
        Alert.alert('خطأ في الخادم', 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً');
      } else if (status === 0 || msg.includes('Network') || msg.includes('timeout')) {
        Alert.alert('خطأ في الاتصال', 'تحقق من اتصال الإنترنت وحاول مجدداً');
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

  // عدم رسم المحتوى إذا لم يكن مصادقاً (سيُعاد التوجيه قريباً)
  if (!providerToken || !providerUser) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontFamily: 'Cairo_400Regular', color: Colors.textMuted, fontSize: 14 }}>
          جاري التحقق...
        </Text>
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

export default function AddServiceScreen() {
  return (
    <ScreenErrorBoundary>
      <AddServiceContent />
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
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
  textArea: { minHeight: 100 },
  btnWrapper: { marginTop: 8 },
});
