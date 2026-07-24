import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export const hapticImpact = () => {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};

export const hapticNotification = (type: 'success' | 'error' | 'warning' = 'success') => {
  if (Platform.OS === 'web') return;
  const map = {
    success: Haptics.NotificationFeedbackType.Success,
    error: Haptics.NotificationFeedbackType.Error,
    warning: Haptics.NotificationFeedbackType.Warning,
  };
  Haptics.notificationAsync(map[type]).catch(() => {});
};
