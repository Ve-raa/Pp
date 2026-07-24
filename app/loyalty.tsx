import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList, ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors } from '../src/constants/colors';
import { Header } from '../src/components/common/Header';
import { Button } from '../src/components/common/Button';
import { getLoyaltyInfo, redeemLoyaltyPoints } from '../src/api/loyalty';
import type { LoyaltyTransaction } from '../src/types';

const TIER_COLORS: Record<string, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: Colors.primary,
};

export default function LoyaltyScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: loyalty, isLoading } = useQuery({
    queryKey: ['loyalty'],
    queryFn: getLoyaltyInfo,
  });

  const redeemMutation = useMutation({
    mutationFn: () => redeemLoyaltyPoints(loyalty?.points || 0),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['loyalty'] });
      Alert.alert('تم الاسترداد ✅', `تم استرداد نقاطك بخصم ${res.discount} ر.س`);
    },
    onError: () => Alert.alert('خطأ', 'تعذّر استرداد النقاط'),
  });

  const tierColor = TIER_COLORS[loyalty?.tier?.toLowerCase() || 'bronze'] || Colors.primary;
  const progress = loyalty?.pointsToNextTier
    ? Math.min(100, ((loyalty.points / (loyalty.points + loyalty.pointsToNextTier)) * 100))
    : 100;

  if (isLoading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={Colors.primary} size="large" /></View>;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="برنامج الولاء" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Tier Card */}
        <View style={[styles.tierCard, { borderColor: tierColor }]}>
          <View style={styles.tierBadge}>
            <Ionicons name="trophy" size={40} color={tierColor} />
            <Text style={[styles.tierName, { color: tierColor }]}>{loyalty?.tierName || loyalty?.tier || 'Bronze'}</Text>
          </View>
          <View style={styles.tierInfo}>
            <Text style={styles.pointsLabel}>رصيد النقاط</Text>
            <Text style={[styles.pointsValue, { color: tierColor }]}>{loyalty?.points || 0}</Text>
            <Text style={styles.pointsSub}>نقطة</Text>
          </View>
        </View>

        {/* Progress */}
        {loyalty?.nextTier && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressNextTier}>{loyalty.nextTier}</Text>
              <Text style={styles.progressLabel}>التقدم نحو المستوى التالي</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: tierColor }]} />
            </View>
            <Text style={styles.progressText}>
              {loyalty.pointsToNextTier} نقطة متبقية للوصول إلى {loyalty.nextTier}
            </Text>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{loyalty?.totalEarned || 0}</Text>
            <Text style={styles.statLabel}>إجمالي المكتسب</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.stat}>
            <Text style={styles.statVal}>{loyalty?.totalRedeemed || 0}</Text>
            <Text style={styles.statLabel}>إجمالي المستردّ</Text>
          </View>
        </View>

        {/* Redeem */}
        {(loyalty?.points || 0) >= 100 && (
          <View style={styles.redeemCard}>
            <Text style={styles.redeemTitle}>استرداد النقاط</Text>
            <Text style={styles.redeemDesc}>
              استرد {loyalty?.points} نقطة واحصل على خصم في طلبك القادم
            </Text>
            <Button
              title={`استرداد ${loyalty?.points} نقطة`}
              onPress={() => Alert.alert('تأكيد', `هل تريد استرداد ${loyalty?.points} نقطة؟`, [
                { text: 'إلغاء', style: 'cancel' },
                { text: 'استرداد', onPress: () => redeemMutation.mutate() },
              ])}
              loading={redeemMutation.isPending}
              variant="secondary"
              fullWidth
            />
          </View>
        )}

        {/* History */}
        {loyalty?.history && loyalty.history.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>سجل النقاط</Text>
            {loyalty.history.map((tx: LoyaltyTransaction) => (
              <View key={tx.id} style={styles.txItem}>
                <View>
                  <Text style={styles.txDate}>{new Date(tx.createdAt).toLocaleDateString('ar-SA')}</Text>
                </View>
                <View style={styles.txRight}>
                  <Text style={[styles.txPoints, { color: tx.type === 'earn' ? Colors.success : Colors.error }]}>
                    {tx.type === 'earn' ? '+' : '-'}{tx.points} نقطة
                  </Text>
                  <Text style={styles.txDesc}>{tx.description}</Text>
                  <View style={[styles.txIcon, { backgroundColor: tx.type === 'earn' ? Colors.successLight : Colors.errorLight }]}>
                    <Ionicons name={tx.type === 'earn' ? 'add' : 'remove'} size={16} color={tx.type === 'earn' ? Colors.success : Colors.error} />
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
  tierCard: {
    margin: 16,
    backgroundColor: Colors.cardBg,
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: Colors.shadowColorDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  tierBadge: { alignItems: 'center', gap: 8 },
  tierName: { fontFamily: 'Cairo_700Bold', fontSize: 16 },
  tierInfo: { alignItems: 'flex-end' },
  pointsLabel: { fontFamily: 'Cairo_400Regular', fontSize: 13, color: Colors.textMuted },
  pointsValue: { fontFamily: 'Cairo_700Bold', fontSize: 52, lineHeight: 60 },
  pointsSub: { fontFamily: 'Cairo_600SemiBold', fontSize: 16, color: Colors.textMuted },
  progressCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.cardBg, borderRadius: 16, padding: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { fontFamily: 'Cairo_400Regular', fontSize: 13, color: Colors.textMuted },
  progressNextTier: { fontFamily: 'Cairo_700Bold', fontSize: 13, color: Colors.primary },
  progressBar: { height: 10, backgroundColor: Colors.lightPurple, borderRadius: 5, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 5 },
  progressText: { fontFamily: 'Cairo_400Regular', fontSize: 12, color: Colors.textMuted, textAlign: 'right' },
  statsRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.cardBg, borderRadius: 16, padding: 16 },
  stat: { flex: 1, alignItems: 'center' },
  statDiv: { width: 1, backgroundColor: Colors.border },
  statVal: { fontFamily: 'Cairo_700Bold', fontSize: 24, color: Colors.primary },
  statLabel: { fontFamily: 'Cairo_400Regular', fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 4 },
  redeemCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.cardBg, borderRadius: 16, padding: 16 },
  redeemTitle: { fontFamily: 'Cairo_700Bold', fontSize: 16, color: Colors.textPrimary, textAlign: 'right', marginBottom: 6 },
  redeemDesc: { fontFamily: 'Cairo_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'right', marginBottom: 14, lineHeight: 22 },
  historySection: { marginHorizontal: 16 },
  historyTitle: { fontFamily: 'Cairo_700Bold', fontSize: 16, color: Colors.textPrimary, textAlign: 'right', marginBottom: 12 },
  txItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.cardBg, borderRadius: 14, padding: 14, marginBottom: 10 },
  txRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  txIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  txDesc: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: Colors.textPrimary, textAlign: 'right' },
  txPoints: { fontFamily: 'Cairo_700Bold', fontSize: 14, textAlign: 'right' },
  txDate: { fontFamily: 'Cairo_400Regular', fontSize: 11, color: Colors.textMuted },
});
