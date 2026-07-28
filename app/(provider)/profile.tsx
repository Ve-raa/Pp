import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { useAuthStore } from '../../src/store/authStore';

export default function ProviderProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { providerUser, logoutProvider, buyerToken, switchMode } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'خروج',
        style: 'destructive',
        onPress: async () => {
          await logoutProvider();
          router.replace('/(provider)/login');
        },
      },
    ]);
  };

  const menuItems = [
    { icon: 'grid-outline' as const,    label: 'خدماتي',          onPress: () => router.push('/(provider)/services'),  color: Colors.primary },
    { icon: 'receipt-outline' as const, label: 'الطلبات',         onPress: () => router.push('/(provider)/orders'),    color: Colors.accent },
    { icon: 'cash-outline' as const,    label: 'الأرباح',         onPress: () => router.push('/(provider)/earnings'),  color: Colors.success },
    { icon: 'card-outline' as const,    label: 'اشتراكات الخطة',  onPress: () => {},                                  color: Colors.info },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Branded Hero Header ── */}
        <View style={styles.heroSection}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {providerUser?.name?.[0]?.toUpperCase() || 'P'}
              </Text>
            </View>
          </View>
          <Text style={styles.heroName}>{providerUser?.name || 'مزود الخدمة'}</Text>
          {providerUser?.businessName ? (
            <Text style={styles.heroBusiness}>{providerUser.businessName}</Text>
          ) : null}
          <Text style={styles.heroEmail}>{providerUser?.email}</Text>
          {providerUser?.isVerified ? (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={13} color={Colors.success} />
              <Text style={styles.verifiedText}>حساب موثّق</Text>
            </View>
          ) : null}
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <View style={[styles.statIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="star" size={16} color="#F59E0B" />
            </View>
            <Text style={styles.statVal}>{providerUser?.rating?.toFixed(1) || '—'}</Text>
            <Text style={styles.statLabel}>التقييم</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.stat}>
            <View style={[styles.statIconWrap, { backgroundColor: `${Colors.primary}15` }]}>
              <Ionicons name="bag-handle-outline" size={16} color={Colors.primary} />
            </View>
            <Text style={styles.statVal}>{providerUser?.totalOrders || 0}</Text>
            <Text style={styles.statLabel}>الطلبات</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.stat}>
            <View style={[styles.statIconWrap, { backgroundColor: `${Colors.success}15` }]}>
              <Ionicons name="location-outline" size={16} color={Colors.success} />
            </View>
            <Text style={styles.statVal}>{providerUser?.country || 'SA'}</Text>
            <Text style={styles.statLabel}>الدولة</Text>
          </View>
        </View>

        {/* ── Menu ── */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>الحساب</Text>
        </View>
        <View style={styles.menuCard}>
          {menuItems.map((item, i) => (
            <View key={item.label}>
              <TouchableOpacity style={styles.menuItem} onPress={item.onPress} activeOpacity={0.7}>
                <Ionicons name="chevron-back" size={16} color={Colors.border} />
                <View style={styles.menuRight}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <View style={[styles.menuIcon, { backgroundColor: `${item.color}18` }]}>
                    <Ionicons name={item.icon} size={18} color={item.color} />
                  </View>
                </View>
              </TouchableOpacity>
              {i < menuItems.length - 1 && <View style={styles.menuDiv} />}
            </View>
          ))}
        </View>

        {/* ── Actions ── */}
        <View style={styles.actionsSection}>
          {buyerToken ? (
            <TouchableOpacity
              style={styles.switchBtn}
              onPress={() => { switchMode('buyer'); router.replace('/(buyer)'); }}
              activeOpacity={0.8}
            >
              <View style={styles.switchIconWrap}>
                <Ionicons name="person-outline" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.switchText}>التبديل إلى حساب المشتري</Text>
              <Ionicons name="chevron-back" size={16} color={Colors.primary} />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <View style={styles.logoutIconWrap}>
              <Ionicons name="log-out-outline" size={18} color={Colors.error} />
            </View>
            <Text style={styles.logoutText}>تسجيل الخروج</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  heroSection: {
    backgroundColor: Colors.purpleDeep,
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 36,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 20,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: 'Cairo_700Bold', fontSize: 36, color: '#fff' },
  heroName: { fontFamily: 'Cairo_700Bold', fontSize: 22, color: '#fff', textAlign: 'center' },
  heroBusiness: { fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 4 },
  heroEmail: { fontFamily: 'Cairo_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 4 },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10,
    backgroundColor: `${Colors.success}25`, paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: `${Colors.success}40`,
  },
  verifiedText: { fontFamily: 'Cairo_600SemiBold', fontSize: 12, color: Colors.success },

  statsRow: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 20,
    backgroundColor: Colors.cardBg, borderRadius: 18, padding: 18,
    shadowColor: Colors.shadowColorDark, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statDiv: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },
  statIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statVal: { fontFamily: 'Cairo_700Bold', fontSize: 20, color: Colors.textPrimary },
  statLabel: { fontFamily: 'Cairo_400Regular', fontSize: 11, color: Colors.textMuted },

  sectionLabel: { paddingHorizontal: 20, marginBottom: 8 },
  sectionLabelText: { fontFamily: 'Cairo_700Bold', fontSize: 14, color: Colors.textMuted },

  menuCard: {
    marginHorizontal: 16, marginBottom: 20, backgroundColor: Colors.cardBg,
    borderRadius: 18, overflow: 'hidden',
    shadowColor: Colors.shadowColorDark, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  menuRight: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10 },
  menuIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: Colors.textPrimary },
  menuDiv: { height: 1, backgroundColor: Colors.border, marginHorizontal: 16 },

  actionsSection: { marginHorizontal: 16, gap: 10 },
  switchBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.cardBg,
    borderRadius: 16, padding: 14, borderWidth: 1.5, borderColor: `${Colors.primary}30`, gap: 10,
  },
  switchIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: `${Colors.primary}15`, alignItems: 'center', justifyContent: 'center' },
  switchText: { flex: 1, fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: Colors.primary, textAlign: 'right' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.cardBg,
    borderRadius: 16, padding: 14, borderWidth: 1.5, borderColor: `${Colors.error}30`, gap: 10,
  },
  logoutIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: `${Colors.error}12`, alignItems: 'center', justifyContent: 'center' },
  logoutText: { flex: 1, fontFamily: 'Cairo_700Bold', fontSize: 14, color: Colors.error, textAlign: 'right' },
});
