import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../src/constants/colors';
import { Header } from '../src/components/common/Header';
import { Button } from '../src/components/common/Button';
import { EmptyState } from '../src/components/common/EmptyState';
import { getWallet, getWalletTransactions, topUpWallet } from '../src/api/wallet';
import type { WalletTransaction } from '../src/types';

const TOP_UP_AMOUNTS = [50, 100, 200, 500];

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const [topupAmount, setTopupAmount] = useState<number | null>(null);
  const [topupLoading, setTopupLoading] = useState(false);

  const { data: wallet, isLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: getWallet,
  });

  const { data: txData } = useQuery({
    queryKey: ['wallet-transactions'],
    queryFn: () => getWalletTransactions({ limit: 50 }),
  });

  const handleTopUp = async () => {
    if (!topupAmount) return;
    setTopupLoading(true);
    try {
      const res = await topUpWallet(topupAmount, 'stripe');
      if (res.paymentUrl) {
        Alert.alert('إعادة توجيه', 'ستُنقل إلى صفحة الدفع لإتمام عملية الشحن');
      } else {
        Alert.alert('تم الشحن ✅', `تم شحن ${topupAmount} ر.س بنجاح`);
      }
    } catch {
      Alert.alert('خطأ', 'تعذّر إتمام عملية الشحن');
    } finally {
      setTopupLoading(false);
    }
  };

  if (isLoading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={Colors.primary} size="large" /></View>;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="المحفظة" showBack />

      <FlatList
        data={txData?.transactions || []}
        keyExtractor={(t) => t.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={
          <View>
            {/* Balance Card */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>الرصيد الحالي</Text>
              <Text style={styles.balanceAmount}>{wallet?.balance?.toFixed(2) || '0.00'}</Text>
              <Text style={styles.balanceCurrency}>{wallet?.currency || 'ر.س'}</Text>
            </View>

            {/* Top-up */}
            <View style={styles.topupCard}>
              <Text style={styles.topupTitle}>شحن المحفظة</Text>
              <View style={styles.amountsRow}>
                {TOP_UP_AMOUNTS.map((a) => (
                  <TouchableOpacity
                    key={a}
                    onPress={() => setTopupAmount(a)}
                    style={[styles.amountChip, topupAmount === a && styles.amountChipActive]}
                  >
                    <Text style={[styles.amountText, topupAmount === a && styles.amountTextActive]}>
                      {a} ر.س
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Button
                title={topupAmount ? `شحن ${topupAmount} ر.س` : 'اختر المبلغ'}
                onPress={handleTopUp}
                loading={topupLoading}
                disabled={!topupAmount}
                fullWidth
                style={{ marginTop: 12 }}
              />
            </View>

            <Text style={styles.historyTitle}>سجل المعاملات</Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState icon="receipt-outline" title="لا توجد معاملات بعد" subtitle="ستظهر هنا سجل معاملاتك في المحفظة" />
        }
        renderItem={({ item }: { item: WalletTransaction }) => (
          <View style={styles.txCard}>
            <View>
              <Text style={styles.txDate}>{new Date(item.createdAt).toLocaleDateString('ar-SA')}</Text>
              {item.balance !== undefined && (
                <Text style={styles.txBalance}>الرصيد: {item.balance?.toFixed(2)} ر.س</Text>
              )}
            </View>
            <View style={styles.txRight}>
              <Text style={[styles.txAmount, { color: item.type === 'credit' ? Colors.success : Colors.error }]}>
                {item.type === 'credit' ? '+' : '-'}{item.amount?.toFixed(2)} ر.س
              </Text>
              <Text style={styles.txDesc}>{item.description}</Text>
              <View style={[styles.txIcon, { backgroundColor: item.type === 'credit' ? Colors.successLight : Colors.errorLight }]}>
                <Ionicons
                  name={item.type === 'credit' ? 'arrow-down' : 'arrow-up'}
                  size={18}
                  color={item.type === 'credit' ? Colors.success : Colors.error}
                />
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  balanceCard: {
    margin: 16,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  balanceLabel: { fontFamily: 'Cairo_400Regular', fontSize: 15, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  balanceAmount: { fontFamily: 'Cairo_700Bold', fontSize: 48, color: '#fff' },
  balanceCurrency: { fontFamily: 'Cairo_600SemiBold', fontSize: 18, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  topupCard: { marginHorizontal: 16, marginBottom: 20, backgroundColor: Colors.cardBg, borderRadius: 16, padding: 16 },
  topupTitle: { fontFamily: 'Cairo_700Bold', fontSize: 15, color: Colors.textPrimary, textAlign: 'right', marginBottom: 12 },
  amountsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' },
  amountChip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, backgroundColor: Colors.lightPurple, borderWidth: 1.5, borderColor: Colors.border },
  amountChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  amountText: { fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: Colors.purpleMid },
  amountTextActive: { color: '#fff' },
  historyTitle: { fontFamily: 'Cairo_700Bold', fontSize: 16, color: Colors.textPrimary, textAlign: 'right', paddingHorizontal: 16, marginBottom: 8 },
  txCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    shadowColor: Colors.shadowColorDark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  txRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  txIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  txDesc: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: Colors.textPrimary, textAlign: 'right' },
  txAmount: { fontFamily: 'Cairo_700Bold', fontSize: 15, textAlign: 'right' },
  txDate: { fontFamily: 'Cairo_400Regular', fontSize: 11, color: Colors.textMuted, textAlign: 'left' },
  txBalance: { fontFamily: 'Cairo_400Regular', fontSize: 11, color: Colors.textLight, textAlign: 'left', marginTop: 2 },
});
