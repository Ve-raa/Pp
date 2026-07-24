import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Colors } from '../src/constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ONBOARDING_KEY = 'vera_onboarding_done';

const slides = [
  {
    id: '1',
    title: 'مرحباً بك في VÉRA',
    subtitle: 'منصة الخدمات المنزلية الأولى في الخليج — آلاف الخدمات بضغطة واحدة',
    icon: 'home',
    bg: Colors.primary,
    accent: Colors.primaryLight,
  },
  {
    id: '2',
    title: 'تسوق بثقة واطمئنان',
    subtitle: 'مزودو خدمة معتمدون، تقييمات حقيقية، ودفع آمن عبر Stripe وTabby وTamara',
    icon: 'shield-checkmark',
    bg: Colors.accent,
    accent: '#f472b6',
  },
  {
    id: '3',
    title: 'تتبع طلباتك لحظة بلحظة',
    subtitle: 'إشعارات فورية، تتبع مباشر، وبرنامج ولاء حصري يكافئك على كل طلب',
    icon: 'location',
    bg: Colors.purpleGradientStart,
    accent: Colors.purpleGradientEnd,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatRef = useRef<FlatList>(null);
  const [current, setCurrent] = useState(0);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (current < slides.length - 1) {
      flatRef.current?.scrollToIndex({ index: current + 1 });
      setCurrent(current + 1);
    } else {
      handleDone();
    }
  };

  const handleDone = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    router.replace('/(auth)/login');
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    router.replace('/(auth)/login');
  };

  const renderSlide = ({ item }: { item: typeof slides[0] }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={[styles.iconCircle, { backgroundColor: `${item.accent}40` }]}>
        <Ionicons name={item.icon as any} size={80} color="#fff" />
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </View>
  );

  const slide = slides[current];

  return (
    <View style={[styles.container, { backgroundColor: slide.bg }]}>
      {/* Skip button */}
      <TouchableOpacity
        onPress={handleSkip}
        style={[styles.skip, { top: insets.top + 16 }]}
      >
        <Text style={styles.skipText}>تخطى</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={styles.flatList}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === current && styles.dotActive]}
          />
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity
        onPress={handleNext}
        style={[styles.btn, { marginBottom: insets.bottom + 20 }]}
        activeOpacity={0.85}
      >
        <Text style={styles.btnText}>
          {current === slides.length - 1 ? 'ابدأ الآن' : 'التالي'}
        </Text>
        <Ionicons name="chevron-back" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  skip: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  skipText: { fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: '#fff' },
  flatList: { flexGrow: 0 },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  title: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 28,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 26,
  },
  dots: { flexDirection: 'row', gap: 8, marginBottom: 40 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: { width: 24, backgroundColor: '#fff' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1.5,
    borderColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
  },
  btnText: { fontFamily: 'Cairo_700Bold', fontSize: 17, color: '#fff' },
});
