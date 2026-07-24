import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { Header } from '../../src/components/common/Header';
import { useAuthStore } from '../../src/store/authStore';

export default function ProviderProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { providerUser, logoutProvider, buyerToken, switchMode } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'خروج', style: 'destructive', onPress: async () => { await logoutProvider(); router.replace('/(provider)/login'); } },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="ملفي الشخصي" showBack />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{providerUser?.name?.[0]?.toUpperCase() || 'P'}</Text>
          </View>
          <Text style={styles.name}>{providerUser?.name || 'مزود الخدمة'}</Text>
          {providerUser?.businessName && (
            <Text style={styles.business}>{providerUser.businessName}</Text>
          )}
          <Text style={styles.email}>{providerUser?.email}</Text>
          {providerUser?.isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
              <Text style={styles.verifiedText}>حساب موثّق</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{providerUser?.rating?.toFixed(1) || '0.0'}</Text>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.statLabel}>التقييم</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.stat}>
            <Text style={styles.statVal}>{providerUser?.totalOrders || 0}</Text>
            <Text style={styles.statLabel}>الطلبات</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.stat}>
            <Text style={styles.statVal}>{providerUser?.country || 'SA'}</Text>
            <Text style={styles.statLabel}>الدولة</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          {[
            { icon: 'grid-outline' as const, label: 'خدماتي', onPress: () => router.push('/(provider)/services'), color: Colors.primary },
            { icon: 'receipt-outline' as const, label: 'الطلبات', onPress: () => router.push('/(provider)/orders'), color: Colors.accent },
            { icon: 'cash-outline' as const, label: 'الأرباح', onPress: () => router.push('/(provider)/earnings'), color: Colors.success },
            { icon: 'card-outline' as const, label: 'اشتراكات الخطة', onPress: () => {}, color: Colors.info },
          ].map((item, i, arr) => (
            <View key={item.label}>
              <TouchableOpacity style={styles.menuItem} onPress={item.onPress}>
                <Ionicons name="chevron-back" size={18} color={Colors.border} />
                <View style={styles.menuLeft}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <View style={[styles.menuIcon, { backgroundColor: `${item.color}20` }]}>
                    <Ionicons name={item.icon} size={18} color={item.color} />
                  </View>
                </View>
              </TouchableOpacity>
              {i < arr.length - 1 && <View style={styles.menuDiv} />}
            </View>
          ))}
        </View>

        {buyerToken && (
          <TouchableOpacity style={styles.switchBtn} onPress={() => { switchMode('buyer'); router.replace('/(buyer)'); }}>
            <Ionicons name="person-outline" size={20} color={Colors.primary} />
            <Text style={styles.switchText}>التبديل إلى حساب المشتري</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  profileCard: { alignItems: 'center', margin: 16, backgroundColor: Colors.cardBg, borderRadius: 20, padding: 24, shadowColor: Colors.shadowColorDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontFamily: 'Cairo_700Bold', fontSize: 34, color: '#fff' },
  name: { fontFamily: 'Cairo_700Bold', fontSize: 22, color: Colors.textPrimary, textAlign: 'center' },
  business: { fontFamily: 'Cairo_600SemiBold', fontSize: 15, color: Colors.purpleMid, textAlign: 'center', marginTop: 4 },
  email: { fontFamily: 'Cairo_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 4 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, backgroundColor: Colors.successLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  verifiedText: { fontFamily: 'Cairo_600SemiBold', fontSize: 12, color: Colors.success },
  statsRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.cardBg, borderRadius: 16, padding: 16 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statDiv: { width: 1, backgroundColor: Colors.border },
  statVal: { fontFamily: 'Cairo_700Bold', fontSize: 22, color: Colors.primary },
  statLabel: { fontFamily: 'Cairo_400Regular', fontSize: 11, color: Colors.textMuted, textAlign: 'center' },
  menuCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.cardBg, borderRadius: 16, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 8 },
  menuLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'flex-end' },
  menuIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: Colors.textPrimary },
  menuDiv: { height: 1, backgroundColor: Colors.border, marginHorizontal: 16 },
  switchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.lightPurple, borderRadius: 14, padding: 16, marginHorizontal: 16, marginBottom: 10, borderWidth: 1.5, borderColor: Colors.border },
  switchText: { fontFamily: 'Cairo_600SemiBold', fontSize: 15, color: Colors.primary },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.errorLight, borderRadius: 14, padding: 16, marginHorizontal: 16 },
  logoutText: { fontFamily: 'Cairo_700Bold', fontSize: 15, color: Colors.error },
});
