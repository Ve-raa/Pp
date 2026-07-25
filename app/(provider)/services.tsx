import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../../src/constants/colors';
import { Header } from '../../src/components/common/Header';
import { EmptyState } from '../../src/components/common/EmptyState';
import { getProviderServices } from '../../src/api/provider';
import type { Service } from '../../src/types';

export default function ProviderServicesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['provider-services'],
    queryFn: () => getProviderServices({ limit: 50 }),
  });

  const goToAdd = () => router.push('/(provider)/add-service');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="خدماتي"
        showBack
        rightComponent={
          <TouchableOpacity onPress={goToAdd} style={styles.addBtn}>
            <Ionicons name="add" size={22} color={Colors.primary} />
          </TouchableOpacity>
        }
      />

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : !data?.services.length ? (
        <EmptyState
          icon="grid-outline"
          title="لا توجد خدمات بعد"
          subtitle="أضف خدماتك الآن وابدأ في استقبال الطلبات"
          actionLabel="إضافة خدمة"
          onAction={goToAdd}
        />
      ) : (
        <FlatList
          data={data.services}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }: { item: Service }) => (
            <View style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: item.isAvailable ? Colors.success : Colors.error },
                  ]}
                />
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{item.title}</Text>
                  <Text style={styles.servicePrice}>{item.price} د.إ</Text>
                </View>
              </View>
              {item.description ? (
                <Text style={styles.serviceDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
              <View style={styles.serviceStats}>
                <View style={styles.statChip}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={styles.statChipText}>
                    {item.rating?.toFixed(1) || '0.0'}
                  </Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.lightPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16 },
  serviceCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadowColorDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  serviceInfo: { flex: 1, alignItems: 'flex-end' },
  serviceName: { fontFamily: 'Cairo_700Bold', fontSize: 15, color: Colors.textPrimary },
  servicePrice: { fontFamily: 'Cairo_700Bold', fontSize: 16, color: Colors.primary, marginTop: 4 },
  serviceDesc: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'right',
    marginBottom: 10,
    lineHeight: 20,
  },
  serviceStats: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.lightPurple,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statChipText: { fontFamily: 'Cairo_600SemiBold', fontSize: 11, color: Colors.textPrimary },
});
