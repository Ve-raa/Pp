import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors } from '../src/constants/colors';
import { EmptyState } from '../src/components/common/EmptyState';
import { Header } from '../src/components/common/Header';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../src/api/notifications';
import type { Notification } from '../src/types';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications({ limit: 50 }),
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const getIcon = (type?: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'order': return 'receipt-outline';
      case 'payment': return 'wallet-outline';
      case 'promo': return 'gift-outline';
      case 'system': return 'settings-outline';
      default: return 'notifications-outline';
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="الإشعارات"
        showBack
        rightComponent={
          unreadCount > 0 ? (
            <TouchableOpacity onPress={() => markAllMutation.mutate()}>
              <Text style={styles.markAllText}>قراءة الكل</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {isLoading ? (
        <View style={styles.loading}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : notifications.length === 0 ? (
        <EmptyState icon="notifications-outline" title="لا توجد إشعارات" subtitle="ستظهر هنا إشعاراتك وتحديثات طلباتك" />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }: { item: Notification }) => (
            <TouchableOpacity
              style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
              onPress={() => !item.isRead && markReadMutation.mutate(item.id)}
              activeOpacity={0.8}
            >
              {!item.isRead && <View style={styles.unreadDot} />}
              <View style={styles.notifContent}>
                <Text style={styles.notifDate} numberOfLines={1}>
                  {new Date(item.createdAt).toLocaleDateString('ar-SA')}
                </Text>
                <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
                <Text style={styles.notifTitle}>{item.title}</Text>
              </View>
              <View style={[styles.notifIcon, { backgroundColor: `${Colors.primary}15` }]}>
                <Ionicons name={getIcon(item.type)} size={22} color={Colors.primary} />
              </View>
            </TouchableOpacity>
          )}
          ListFooterComponent={<View style={{ height: 80 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  markAllText: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: Colors.primary },
  list: { padding: 16 },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    shadowColor: Colors.shadowColorDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  notifCardUnread: { borderRightWidth: 4, borderRightColor: Colors.primary, backgroundColor: `${Colors.primary}06` },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, position: 'absolute', top: 12, left: 12 },
  notifIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifContent: { flex: 1, alignItems: 'flex-end' },
  notifTitle: { fontFamily: 'Cairo_700Bold', fontSize: 14, color: Colors.textPrimary, textAlign: 'right', marginBottom: 4 },
  notifBody: { fontFamily: 'Cairo_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'right', lineHeight: 20 },
  notifDate: { fontFamily: 'Cairo_400Regular', fontSize: 11, color: Colors.textLight, textAlign: 'right', marginTop: 4 },
});
