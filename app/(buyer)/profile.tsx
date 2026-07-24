import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { useAuthStore } from '../../src/store/authStore';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  value?: string;
  color?: string;
  badge?: number;
}

function MenuItem({ icon, label, onPress, value, color = Colors.purpleMid, badge }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name="chevron-back" size={18} color={Colors.border} />
      {value && <Text style={styles.menuValue}>{value}</Text>}
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <View style={styles.menuLeft}>
        <Text style={styles.menuLabel}>{label}</Text>
        <View style={[styles.menuIcon, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { buyerUser, logoutBuyer, providerToken, switchMode } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد من تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'خروج',
        style: 'destructive',
        onPress: async () => {
          await logoutBuyer();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>حسابي</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{buyerUser?.name || 'مستخدم VÉRA'}</Text>
            <Text style={styles.userEmail}>{buyerUser?.email}</Text>
            {buyerUser?.phone && (
              <Text style={styles.userPhone}>{buyerUser.phone}</Text>
            )}
          </View>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{buyerUser?.name?.[0]?.toUpperCase() || 'V'}</Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.stat} onPress={() => router.push('/wallet')}>
            <Text style={styles.statValue}>{buyerUser?.walletBalance?.toFixed(0) || '0'}</Text>
            <Text style={styles.statLabel}>رصيد المحفظة</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.stat} onPress={() => router.push('/loyalty')}>
            <Text style={styles.statValue}>{buyerUser?.loyaltyPoints || '0'}</Text>
            <Text style={styles.statLabel}>نقاط الولاء</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.stat} onPress={() => router.push('/(buyer)/orders')}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>طلباتي</Text>
          </TouchableOpacity>
        </View>

        {/* Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الحساب</Text>
          <View style={styles.menuCard}>
            <MenuItem icon="person-outline" label="الملف الشخصي" color={Colors.primary} onPress={() => {}} />
            <View style={styles.menuDivider} />
            <MenuItem icon="wallet-outline" label="المحفظة" color={Colors.success} onPress={() => router.push('/wallet')} value={`${buyerUser?.walletBalance?.toFixed(2) || '0.00'} ر.س`} />
            <View style={styles.menuDivider} />
            <MenuItem icon="gift-outline" label="برنامج الولاء" color={Colors.accent} onPress={() => router.push('/loyalty')} value={`${buyerUser?.loyaltyPoints || 0} نقطة`} />
            <View style={styles.menuDivider} />
            <MenuItem icon="heart-outline" label="المفضلة" color={Colors.error} onPress={() => router.push('/wishlist')} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الدعم</Text>
          <View style={styles.menuCard}>
            <MenuItem icon="help-circle-outline" label="الدعم الفني" color={Colors.info} onPress={() => router.push('/support')} />
            <View style={styles.menuDivider} />
            <MenuItem icon="document-text-outline" label="الشروط والأحكام" color={Colors.purpleMid} onPress={() => {}} />
            <View style={styles.menuDivider} />
            <MenuItem icon="shield-outline" label="سياسة الخصوصية" color={Colors.purpleMid} onPress={() => {}} />
          </View>
        </View>

        {/* Provider switch */}
        {providerToken && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.switchBtn}
              onPress={() => { switchMode('provider'); router.replace('/(provider)'); }}
            >
              <Ionicons name="briefcase" size={20} color={Colors.primary} />
              <Text style={styles.switchText}>التبديل إلى حساب مزود الخدمة</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
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
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.cardBg },
  headerTitle: { fontFamily: 'Cairo_700Bold', fontSize: 20, color: Colors.textPrimary, textAlign: 'right' },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 16,
    backgroundColor: Colors.cardBg,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.shadowColorDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  userInfo: { flex: 1 },
  userName: { fontFamily: 'Cairo_700Bold', fontSize: 20, color: Colors.textPrimary, textAlign: 'right' },
  userEmail: { fontFamily: 'Cairo_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'right', marginTop: 4 },
  userPhone: { fontFamily: 'Cairo_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'right', marginTop: 2 },
  avatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 0,
  },
  avatarText: { fontFamily: 'Cairo_700Bold', fontSize: 26, color: '#fff' },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBg,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: Colors.shadowColorDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: 'Cairo_700Bold', fontSize: 20, color: Colors.primary },
  statLabel: { fontFamily: 'Cairo_400Regular', fontSize: 11, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: Colors.border },
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontFamily: 'Cairo_700Bold', fontSize: 15, color: Colors.textPrimary, textAlign: 'right', marginBottom: 8 },
  menuCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.shadowColorDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 8 },
  menuLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'flex-end' },
  menuIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: Colors.textPrimary },
  menuValue: { fontFamily: 'Cairo_400Regular', fontSize: 13, color: Colors.textMuted },
  menuDivider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 14 },
  badge: { backgroundColor: Colors.accent, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontFamily: 'Cairo_700Bold', fontSize: 10, color: '#fff' },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.lightPurple,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  switchText: { fontFamily: 'Cairo_600SemiBold', fontSize: 15, color: Colors.primary },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.errorLight,
    borderRadius: 14,
    padding: 16,
  },
  logoutText: { fontFamily: 'Cairo_700Bold', fontSize: 15, color: Colors.error },
});
