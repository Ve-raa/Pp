import React, { useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors } from '../../src/constants/colors';
import { Header } from '../../src/components/common/Header';
import { Button } from '../../src/components/common/Button';
import { createProviderService } from '../../src/api/provider';

export default function AddServiceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    deliveryTime: '',
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const createMutation = useMutation({
    mutationFn: () =>
      createProviderService({
        title: form.title.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price) || 0,
        deliveryTime: form.deliveryTime.trim(),
        images: [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-services'] });
      Alert.alert('تمت الإضافة ✅', 'تم إضافة الخدمة بنجاح', [
        { text: 'حسناً', onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      const status = error?.response?.status;
      if (status === 401) {
        // _onUnauthorized في _layout.tsx سيتولى الأمر
      } else if (status === 422 || status === 400) {
        Alert.alert('بيانات غير صحيحة', 'تحقق من جميع الحقول وحاول مجدداً');
      } else if (status === 500) {
        Alert.alert('خطأ في الخادم', 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً');
      } else {
        Alert.alert('خطأ', 'تعذّر إضافة الخدمة، تحقق من الاتصال وحاول مجدداً');
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Header title="إضافة خدمة جديدة" showBack />

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>عنوان الخدمة *</Text>
          <TextInput
            style={styles.input}
            placeholder="مثال: تصميم شعار احترافي"
            placeholderTextColor={Colors.textLight}
            value={form.title}
            onChangeText={(v) => set('title', v)}
            textAlign="right"
            returnKeyType="next"
          />

          <Text style={styles.label}>وصف الخدمة</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="اكتب وصفاً تفصيلياً للخدمة..."
            placeholderTextColor={Colors.textLight}
            value={form.description}
            onChangeText={(v) => set('description', v)}
            multiline
            numberOfLines={4}
            textAlign="right"
            textAlignVertical="top"
          />

          <Text style={styles.label}>السعر (د.إ) *</Text>
          <TextInput
            style={styles.input}
            placeholder="مثال: 150"
            placeholderTextColor={Colors.textLight}
            value={form.price}
            onChangeText={(v) => set('price', v)}
            keyboardType="numeric"
            textAlign="right"
            returnKeyType="next"
          />

          <Text style={styles.label}>مدة التسليم</Text>
          <TextInput
            style={styles.input}
            placeholder="مثال: 1-3 أيام"
            placeholderTextColor={Colors.textLight}
            value={form.deliveryTime}
            onChangeText={(v) => set('deliveryTime', v)}
            textAlign="right"
            returnKeyType="done"
          />

          <View style={styles.btnWrapper}>
            <Button
              title="إضافة الخدمة"
              onPress={handleSubmit}
              loading={createMutation.isPending}
              fullWidth
            />
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
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
