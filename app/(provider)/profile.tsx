import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  Modal, FlatList, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { useAuthStore } from '../../src/store/authStore';
import { updateProviderProfile } from '../../src/api/provider';

// ─── Countries list (MENA + common) ──────────────────────────────────────────
const COUNTRIES = [
  { code: 'AE', name: 'الإمارات العربية المتحدة' },
  { code: 'SA', name: 'المملكة العربية السعودية' },
  { code: 'KW', name: 'الكويت' },
  { code: 'BH', name: 'البحرين' },
  { code: 'QA', name: 'قطر' },
  { code: 'OM', name: 'عُمان' },
  { code: 'EG', name: 'مصر' },
  { code: 'JO', name: 'الأردن' },
  { code: 'LB', name: 'لبنان' },
  { code: 'IQ', name: 'العراق' },
  { code: 'YE', name: 'اليمن' },
  { code: 'SY', name: 'سوريا' },
  { code: 'PS', name: 'فلسطين' },
  { code: 'LY', name: 'ليبيا' },
  { code: 'TN', name: 'تونس' },
  { code: 'MA', name: 'المغرب' },
  { code: 'DZ', name: 'الجزائر' },
  { code: 'SD', name: 'السودان' },
  { code: 'TR', name: 'تركيا' },
  { code: 'GB', name: 'المملكة المتحدة' },
  { code: 'US', name: 'الولايات المتحدة' },
  { code: 'DE', name: 'ألمانيا' },
  { code: 'FR', name: 'فرنسا' },
];

function getCountryName(code?: string): string {
  if (!code) return '—';
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
}

export default function ProviderProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { providerUser, logoutProvider, buyerToken, switchMode, updateProviderUser } = useAuthStore();

  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [savingCountry, setSavingCountry] = useState(false);

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

  const handleChangeCountry = async (code: string) => {
    setShowCountryPicker(false);
    if (code === providerUser?.country) return;
    setSavingCountry(true);
    try {
      await updateProviderProfile({ country: code });
      updateProviderUser({ country: code });
    } catch {
      Alert.alert('خطأ', 'تعذّر تحديث الدولة، يرجى المحاولة لاحقاً');
    } finally {
      setSavingCountry(false);
    }
  };

  const menuItems = [
    { icon: 'grid-outline' as const,    label: 'خدماتي',          onPress: () => router.push('/(provider)/services'),  color: Colors.primary },
    { icon: 'receipt-outline' as const, label: 'الطلبات',         onPress: () => router.push('/(provider)/orders'),    color: Colors.accent },
    { icon: 'cash-outline' as const,    label: 'الأرباح',         onPress: () => router.push('/(provider)/earnings'),  color: Colors.success },
    { icon: 'card-outline' as const,    label: 'اشتراكات الخطة',  onPress: () => {},                                  color: Colors.info },
  ];

  return (
    <>
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
            {/* ── Country — tappable to change ── */}
            <TouchableOpacity
              style={styles.stat}
              onPress={() => setShowCountryPicker(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.statIconWrap, { backgroundColor: `${Colors.success}15` }]}>
                {savingCountry ? (
                  <ActivityIndicator size="small" color={Colors.success} />
                ) : (
                  <Ionicons name="location-outline" size={16} color={Colors.success} />
                )}
              </View>
              <Text style={styles.statVal}>{providerUser?.country || 'AE'}</Text>
              <View style={styles.changeCountryRow}>
                <Text style={styles.statLabel}>الدولة</Text>
                <Ionicons name="pencil-outline" size={10} color={Colors.primary} />
              </View>
            </TouchableOpacity>
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

      {/* ── Country Picker Modal ──────────────────────────────────────────── */}
      <Modal
        visible={showCountryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCountryPicker(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>تغيير الدولة</Text>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryItem,
                    providerUser?.country === item.code && styles.countryItemActive,
                  ]}
                  onPress={() => handleChangeCountry(item.code)}
                  activeOpacity={0.7}
                >
                  {providerUser?.country === item.code && (
                    <Ionicons name="checkmark" size={18} color={Colors.primary} />
                  )}
                  <Text
                    style={[
                      styles.countryItemText,
                      providerUser?.country === item.code && styles.countryItemTextActive,
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text style={styles.countryCode}>{item.code}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
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
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
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
  changeCountryRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },

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

  // Country picker modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.cardBg,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '75%',
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: Colors.border,
    borderRadius: 2, alignSelf: 'center', marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Cairo_700Bold', fontSize: 17, color: Colors.textPrimary,
    textAlign: 'center', marginBottom: 16,
  },
  countryItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 10,
  },
  countryItemActive: {
    backgroundColor: `${Colors.primary}0A`, borderRadius: 10,
    borderBottomColor: 'transparent', paddingHorizontal: 8,
  },
  countryItemText: {
    flex: 1, fontFamily: 'Cairo_400Regular', fontSize: 15,
    color: Colors.textPrimary, textAlign: 'right',
  },
  countryItemTextActive: { fontFamily: 'Cairo_600SemiBold', color: Colors.primary },
  countryCode: { fontFamily: 'Cairo_400Regular', fontSize: 12, color: Colors.textMuted, minWidth: 30 },
});
