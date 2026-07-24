import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors } from '../../src/constants/colors';
import { Header } from '../../src/components/common/Header';
import { Button } from '../../src/components/common/Button';
import { EmptyState } from '../../src/components/common/EmptyState';
import { getProviderServices, createProviderService } from '../../src/api/provider';
import type { Service } from '../../src/types';

export default function ProviderServicesScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', price: '', deliveryTime: '' });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const { data, isLoading } = useQuery({
    queryKey: ['provider-services'],
    queryFn: () => getProviderServices({ limit: 50 }),
  });

  const createMutation = useMutation({
    mutationFn: () => createProviderService({
      title: form.title,
      description: form.description,
      price: parseFloat(form.price),
      deliveryTime: form.deliveryTime,
      images: [],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-services'] });
      setAddModal(false);
      setForm({ title: '', description: '', price: '', deliveryTime: '' });
      Alert.alert('تمت الإضافة ✅', 'تم إضافة الخدمة بنجاح');
    },
    onError: () => Alert.alert('خطأ', 'تعذّر إضافة الخدمة'),
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="خدماتي"
        showBack
        rightComponent={
          <TouchableOpacity onPress={() => setAddModal(true)} style={styles.addBtn}>
            <Ionicons name="add" size={22} color={Colors.primary} />
          </TouchableOpacity>
        }
      />

      {isLoading ? (
        <View style={styles.loading}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : !data?.services.length ? (
        <EmptyState
          icon="grid-outline"
          title="لا توجد خدمات بعد"
          subtitle="أضف خدماتك الآن وابدأ في استقبال الطلبات"
          actionLabel="إضافة خدمة"
          onAction={() => setAddModal(true)}
        />
      ) : (
        <FlatList
          data={data.services}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }: { item: Service }) => (
            <View style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <View style={[styles.statusDot, { backgroundColor: item.isAvailable ? Colors.success : Colors.error }]} />
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{item.title}</Text>
                  <Text style={styles.servicePrice}>{item.price} ر.س</Text>
                </View>
              </View>
              {item.description && (
                <Text style={styles.serviceDesc} numberOfLines={2}>{item.description}</Text>
              )}
              <View style={styles.serviceStats}>
                <View style={styles.statChip}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={styles.statChipText}>{item.rating?.toFixed(1) || '0.0'}</Text>
                </View>
                <View style={styles.statChip}>
                  <Ionicons name="cube-outline" size={12} color={Colors.primary} />
                  <Text style={styles.statChipText}>{item.ordersCount || 0} طلب</Text>
                </View>
              </View>
            </View>
          )}
          ListFooterComponent={<View style={{ height: 80 }} />}
        />
      )}

      {/* Add Service Modal */}
      <Modal visible={addModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setAddModal(false)}>
                <Ionicons name="close" size={24} color={Colors.purpleDark} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>إضافة خدمة جديدة</Text>
            </View>
            <TextInput style={styles.input} placeholder="عنوان الخدمة *" placeholderTextColor={Colors.textLight} value={form.title} onChangeText={(v) => set('title', v)} textAlign="right" />
            <TextInput style={[styles.input, styles.textArea]} placeholder="وصف الخدمة" placeholderTextColor={Colors.textLight} value={form.description} onChangeText={(v) => set('description', v)} multiline numberOfLines={3} textAlign="right" textAlignVertical="top" />
            <TextInput style={styles.input} placeholder="السعر (ر.س) *" placeholderTextColor={Colors.textLight} value={form.price} onChangeText={(v) => set('price', v)} keyboardType="numeric" textAlign="right" />
            <TextInput style={styles.input} placeholder="مدة التسليم (مثال: 1-3 أيام)" placeholderTextColor={Colors.textLight} value={form.deliveryTime} onChangeText={(v) => set('deliveryTime', v)} textAlign="right" />
            <Button title="إضافة الخدمة" onPress={() => createMutation.mutate()} loading={createMutation.isPending} disabled={!form.title || !form.price} fullWidth />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.lightPurple, alignItems: 'center', justifyContent: 'center' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16 },
  serviceCard: { backgroundColor: Colors.cardBg, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: Colors.shadowColorDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  serviceHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  serviceInfo: { flex: 1, alignItems: 'flex-end' },
  serviceName: { fontFamily: 'Cairo_700Bold', fontSize: 15, color: Colors.textPrimary },
  servicePrice: { fontFamily: 'Cairo_700Bold', fontSize: 16, color: Colors.primary, marginTop: 4 },
  serviceDesc: { fontFamily: 'Cairo_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'right', marginBottom: 10, lineHeight: 20 },
  serviceStats: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.lightPurple, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  statChipText: { fontFamily: 'Cairo_600SemiBold', fontSize: 11, color: Colors.textPrimary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontFamily: 'Cairo_700Bold', fontSize: 18, color: Colors.textPrimary },
  input: { backgroundColor: Colors.lightPurple, borderRadius: 12, padding: 14, fontFamily: 'Cairo_400Regular', fontSize: 14, color: Colors.textPrimary, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  textArea: { minHeight: 80 },
});
