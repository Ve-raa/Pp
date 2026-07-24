import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightComponent?: React.ReactNode;
  transparent?: boolean;
  light?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = true,
  onBack,
  rightComponent,
  transparent = false,
  light = false,
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBack = () => {
    onBack ? onBack() : router.back();
  };

  const textColor = light ? Colors.textWhite : Colors.purpleDark;
  const iconColor = light ? Colors.textWhite : Colors.purpleDark;
  const bgColor = transparent ? 'transparent' : Colors.cardBg;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 4, backgroundColor: bgColor },
        !transparent && styles.shadow,
      ]}
    >
      <StatusBar
        barStyle={light ? 'light-content' : 'dark-content'}
        backgroundColor={transparent ? 'transparent' : bgColor}
        translucent={transparent}
      />
      {showBack ? (
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="chevron-forward" size={24} color={iconColor} />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
      {title && (
        <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
          {title}
        </Text>
      )}
      <View style={styles.right}>{rightComponent || <View style={styles.placeholder} />}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  shadow: {
    shadowColor: Colors.shadowColorDark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lightPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  right: { width: 40, alignItems: 'center' },
  placeholder: { width: 40 },
});
