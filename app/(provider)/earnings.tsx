import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Colors } from '../../src/constants/colors';
import { Header } from '../../src/components/common/Header';
import { Button } from '../../src/components/common/Button';
import { getProviderEarnings, requestPayout } from '../../src/api/provider';

export default function ProviderEarningsScreen() {
  const insets = useSafeAreaInsets();
  const [payoutAmount, setPayoutAmount] = useState<number | null>(null);

  const { data: earnings, isLoading } = useQuery({
    queryKey: ['provider-earnings'],
    queryFn: getProviderEarnings,
  });

  const payoutMutation = useMutation({
    mutationFn: () => requestPayout(payoutAmount || 0),
    onSuccess: () => Alert.alert('تم الطلب ✅', 'تم إرسال طلب السحب. سيتم المعالجة خلال 3-5 أيام عمل.'),
    onError: () => Alert.alert('خطأ', 'تعذّر إرسال طلب السحب'),
  });

  const handlePayout = () => {
    const available = earnings?.pendingPayout || 0;
    if (available <= 0) return Alert.alert('تنبيه', 'لا يوجد رصيد متاح للسحب');
    Alert.alert('طلب سحب', `هل تريد سحب ${available.toFixed(2)} ر.س؟`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'سحب', onPress: () => { setPayoutAmount(available); payoutMutation.mutate(); } },
    ]);
  };

  if (isLoading) return <View style={[styles.container, { paddingTop: insets.top }]}><Header title="الأرباح" showBack /><View style={styles.loading}><ActivityIndicator color={Colors.primary} size="large" /></View></View>;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="الأرباح والمدفوعات" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Total Card */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>إجمالي الأرباح</Text>
          <Text style={styles.totalAmount}>{earnings?.totalEarnings?.toFixed(2) || '0.00'} ر.س</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{earnings?.thisMonth?.toFixed(2) || '0.00'}</Text>
            <Text style={styles.statLabel}>هذا الشهر (ر.س)</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.stat}>
            <Text style={styles.statVal}>{earnings?.lastMonth?.toFixed(2) || '0.00'}</Text>
            <Text style={styles.statLabel}>الشهر الماضي (ر.س)</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.stat}>
            <Text style={styles.statVal}>{earnings?.paidOut?.toFixed(2) || '0.00'}</Text>
            <Text style={styles.statLabel}>المسحوب (ر.س)</Text>
          </View>
        </View>

        {/* Payout */}
        <View style={styles.payoutCard}>
          <View style={styles.payoutRow}>
            <Text style={styles.payoutLabel}>متاح للسحب</Text>
            <Text style={styles.payoutAmount}>{earnings?.pendingPayout?.toFixed(2) || '0.00'} ر.س</Text>
          </View>
          <Button
            title="طلب سحب"
            onPress={handlePayout}
            loading={payoutMutation.isPending}
            disabled={!earnings?.pendingPayout || earnings.pendingPayout <= 0}
            variant="secondary"
            fullWidth
            style={{ marginTop: 12 }}
          />
          <Text style={styles.payoutNote}>
            يتم تحويل المبالغ عبر Stripe Connect خلال 3-5 أيام عمل
          </Text>
        </View>

        {/* Transactions */}
        {earnings?.transactions && earnings.transactions.length > 0 && (
          <View style={styles.txSection}>
            <Text style={styles.txTitle}>سجل المعاملات</Text>
            {earnings.transactions.map((tx) => (
              <View key={tx.id} style={styles.txCard}>
                <View>
                  <Text style={styles.txDate}>{new Date(tx.createdAt).toLocaleDateString('ar-SA')}</Text>
                  <View style={[styles.txStatus, { backgroundColor: tx.status === 'paid' ? Colors.successLight : Colors.warningLight }]}>
                    <Text style={{ color: tx.status === 'paid' ? Colors.success : Colors.warning, fontFamily: 'Cairo_600SemiBold', fontSize: 11 }}>
                      {tx.status === 'paid' ? 'مُحوَّل' : tx.status === 'processing' ? 'جارٍ' : 'معلق'}
                    </Text>
                  </View>
                </View>
                <View style={styles.txRight}>
                  <Text style={[styles.txAmount, { color: tx.type === 'earning' ? Colors.success : Colors.error }]}>
                    {tx.type === 'earning' ? '+' : '-'}{tx.amount?.toFixed(2)} ر.س
                  </Text>
                  <Text style={styles.txDesc}>{tx.description}</Text>
                  <View style={[styles.txIcon, { backgroundColor: tx.type === 'earning' ? Colors.successLight : Colors.errorLight }]}>
                    <Ionicons name={tx.type === 'earning' ? 'trending-up' : 'cash-outline'} size={18} color={tx.type === 'earning' ? Colors.success : Colors.error} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  totalCard: { margin: 16, backgroundColor: Colors.purpleGradientStart, borderRadius: 20, padding: 28, alignItems: 'center', shadowColor: Colors.purpleGradientStart, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 6 },
  totalLabel: { fontFamily: 'Cairo_400Regular', fontSize: 15, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  totalAmount: { fontFamily: 'Cairo_700Bold', fontSize: 42, color: '#fff' },
  statsRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.cardBg, borderRadius: 16, padding: 16 },
  stat: { flex: 1, alignItems: 'center' },
  statDiv: { width: 1, backgroundColor: Colors.border },
  statVal: { fontFamily: 'Cairo_700Bold', fontSize: 18, color: Colors.primary },
  statLabel: { fontFamily: 'Cairo_400Regular', fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginTop: 4 },
  payoutCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.cardBg, borderRadius: 16, padding: 16 },
  payoutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payoutLabel: { fontFamily: 'Cairo_700Bold', fontSize: 16, color: Colors.textPrimary },
  payoutAmount: { fontFamily: 'Cairo_700Bold', fontSize: 24, color: Colors.success },
  payoutNote: { fontFamily: 'Cairo_400Regular', fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 18 },
  txSection: { marginHorizontal: 16 },
  txTitle: { fontFamily: 'Cairo_700Bold', fontSize: 16, color: Colors.textPrimary, textAlign: 'right', marginBottom: 12 },
  txCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.cardBg, borderRadius: 14, padding: 14, marginBottom: 10 },
  txRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  txIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  txDesc: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: Colors.textPrimary, textAlign: 'right' },
  txAmount: { fontFamily: 'Cairo_700Bold', fontSize: 15, textAlign: 'right' },
  txDate: { fontFamily: 'Cairo_400Regular', fontSize: 11, color: Colors.textMuted, marginBottom: 4 },
  txStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
});
