import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCartStore } from '../../src/store/cartStore';
import { Colors } from '../../src/constants/colors';

function TabIcon({
  name,
  focused,
  label,
  badge,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  label: string;
  badge?: number;
}) {
  return (
    <View style={tabStyles.iconContainer}>
      <View style={tabStyles.badgeWrapper}>
        <Ionicons
          name={focused ? name : (`${name}-outline` as any)}
          size={22}
          color={focused ? Colors.primary : Colors.purpleMid}
        />
        {!!badge && badge > 0 && (
          <View style={tabStyles.badge}>
            <Text style={tabStyles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>{label}</Text>
    </View>
  );
}

export default function BuyerLayout() {
  const insets = useSafeAreaInsets();
  const cartCount = useCartStore((s) => s.itemCount());

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.cardBg,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          elevation: 8,
          shadowColor: Colors.shadowColorDark,
          shadowOpacity: 0.1,
          shadowOffset: { width: 0, height: -2 },
          shadowRadius: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home" focused={focused} label="الرئيسية" />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="search" focused={focused} label="بحث" />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="bag" focused={focused} label="السلة" badge={cartCount} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="receipt" focused={focused} label="طلباتي" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person" focused={focused} label="حسابي" />
          ),
        }}
      />
    </Tabs>
  );
}

const tabStyles = StyleSheet.create({
  iconContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 8 },
  badgeWrapper: { position: 'relative' },
  badge: {
    position: 'absolute',
    top: -4,
    left: -6,
    backgroundColor: Colors.accent,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontFamily: 'Cairo_700Bold', fontSize: 10, color: '#fff' },
  label: { fontFamily: 'Cairo_400Regular', fontSize: 10, color: Colors.purpleMid, marginTop: 2 },
  labelActive: { color: Colors.primary, fontFamily: 'Cairo_600SemiBold' },
});
