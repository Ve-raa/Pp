/**
 * Admin Panel — Section Banners Management
 *
 * Accessible via:  router.push('/admin/banners')
 *
 * Allows admins to add/remove banners for each home-page section.
 * Banners are stored locally (AsyncStorage); the home screen reads them
 * and displays them as sliders above the corresponding section cards.
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { Header } from '../../src/components/common/Header';
import {
  getAllSectionBanners,
  addSectionBanner,
  deleteSectionBanner,
} from '../../src/api/sectionBanners';
import type { SectionBanner, HomeSectionKey } from '../../src/types';

const SECTIONS: { key: HomeSectionKey; label: string }[] = [
  { key: 'featured',      label: 'الخدمات المميزة' },
  { key: 'popular',       label: 'الأكثر مشاهدة' },
  { key: 'best_sellers',  label: 'الأكثر مبيعاً' },
  { key: 'top_providers', label: 'أبرز التجار' },
];

interface AddBannerFormProps {
  sectionKey: HomeSectionKey;
  sectionLabel: string;
  onAdded: () => void;
}
function AddBannerForm({ sectionKey, sectionLabel, onAdded }: AddBannerFormProps) {
  const [image, setImage] = useState('');
  const [link, setLink] = useState('');
  const [title, setTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!image.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال رابط الصورة');
      return;
    }
    setAdding(true);
    try {
      await addSectionBanner(sectionKey, image, link, title);
      setImage('');
      setLink('');
      setTitle('');
      onAdded();
    } catch (e: any) {
      Alert.alert('خطأ', 'تعذّر إضافة البانر');
    } finally {
      setAdding(false);
    }
  };

  return (
    <View style={styles.form}>
      <Text style={styles.formTitle}>إضافة بانر لـ «{sectionLabel}»</Text>

      <TextInput
        style={styles.input}
        placeholder="رابط الصورة (URL) *"
        placeholderTextColor={Colors.textLight}
        value={image}
        onChangeText={setImage}
        textAlign="right"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />

      <TextInput
        style={styles.input}
        placeholder="رابط الانتقال عند الضغط (اختياري)"
        placeholderTextColor={Colors.textLight}
        value={link}
        onChangeText={setLink}
        textAlign="right"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />

      <TextInput
        style={styles.input}
        placeholder="عنوان البانر (اختياري)"
        placeholderTextColor={Colors.textLight}
        value={title}
        onChangeText={setTitle}
        textAlign="right"
      />

      {image.trim() !== '' && (
        <Image
          source={{ uri: image.trim() }}
          style={styles.preview}
          resizeMode="cover"
        />
      )}

      <TouchableOpacity
        style={[styles.addBtn, adding && styles.addBtnDisabled]}
        onPress={handleAdd}
        disabled={adding}
        activeOpacity={0.8}
      >
        {adding ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={styles.addBtnText}>إضافة البانر</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

interface BannerItemProps {
  banner: SectionBanner;
  onDelete: () => void;
}
function BannerItem({ banner, onDelete }: BannerItemProps) {
  const confirmDelete = () =>
    Alert.alert('حذف البانر', 'هل أنت متأكد من حذف هذا البانر؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: onDelete },
    ]);

  return (
    <View style={styles.bannerItem}>
      <Image
        source={{ uri: banner.image }}
        style={styles.bannerThumb}
        resizeMode="cover"
      />
      <View style={styles.bannerInfo}>
        {banner.title ? (
          <Text style={styles.bannerTitle} numberOfLines={1}>{banner.title}</Text>
        ) : null}
        <Text style={styles.bannerUrl} numberOfLines={1}>{banner.image}</Text>
        {banner.link ? (
          <Text style={styles.bannerLink} numberOfLines={1}>{banner.link}</Text>
        ) : null}
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete}>
        <Ionicons name="trash-outline" size={20} color={Colors.error} />
      </TouchableOpacity>
    </View>
  );
}

export default function AdminBannersScreen() {
  const [banners, setBanners] = useState<SectionBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSection, setExpandedSection] = useState<HomeSectionKey | null>(null);

  const load = useCallback(async () => {
    try {
      const all = await getAllSectionBanners();
      setBanners(all);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleDelete = async (id: string) => {
    await deleteSectionBanner(id);
    await load();
  };

  const bannersFor = (key: HomeSectionKey) =>
    banners.filter((b) => b.sectionKey === key);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header title="إدارة بانرات الأقسام" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.hint}>
          أضف بانرات لكل قسم. البانرات تظهر فوق بطاقات القسم في الصفحة الرئيسية كسلايدر.
        </Text>

        {SECTIONS.map(({ key, label }) => {
          const sectionBanners = bannersFor(key);
          const isExpanded = expandedSection === key;

          return (
            <View key={key} style={styles.sectionCard}>
              {/* Section Header */}
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => setExpandedSection(isExpanded ? null : key)}
                activeOpacity={0.8}
              >
                <View style={styles.sectionHeaderLeft}>
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{sectionBanners.length}</Text>
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={Colors.purpleMid}
                  />
                </View>
                <Text style={styles.sectionLabel}>{label}</Text>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.sectionBody}>
                  {/* Existing banners */}
                  {sectionBanners.length > 0 ? (
                    sectionBanners.map((b) => (
                      <BannerItem
                        key={b.id}
                        banner={b}
                        onDelete={() => handleDelete(b.id)}
                      />
                    ))
                  ) : (
                    <Text style={styles.emptyText}>لا توجد بانرات بعد</Text>
                  )}

                  {/* Add form */}
                  <AddBannerForm
                    sectionKey={key}
                    sectionLabel={label}
                    onAdded={load}
                  />
                </View>
              )}
            </View>
          );
        })}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 16 },

  hint: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'right',
    lineHeight: 22,
    marginBottom: 20,
    backgroundColor: Colors.lightPurple2,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Section accordion
  sectionCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadowColorDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionLabel: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  countBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 11,
    color: '#fff',
  },
  sectionBody: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 16,
    gap: 12,
  },

  // Banner item
  bannerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightPurple2,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
    padding: 8,
  },
  bannerThumb: {
    width: 72,
    height: 52,
    borderRadius: 8,
    backgroundColor: Colors.lightPurple,
  },
  bannerInfo: { flex: 1 },
  bannerTitle: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: Colors.textPrimary,
    textAlign: 'right',
    marginBottom: 2,
  },
  bannerUrl: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'right',
  },
  bannerLink: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 11,
    color: Colors.primary,
    textAlign: 'right',
    marginTop: 2,
  },
  deleteBtn: { padding: 8 },

  emptyText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 8,
  },

  // Add banner form
  form: {
    backgroundColor: Colors.lightPurple2,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    gap: 10,
  },
  formTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    color: Colors.textPrimary,
    textAlign: 'right',
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.cardBg,
    borderRadius: 10,
    padding: 12,
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  preview: {
    width: '100%',
    height: 90,
    borderRadius: 10,
    backgroundColor: Colors.lightPurple,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addBtnDisabled: { opacity: 0.6 },
  addBtnText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    color: '#fff',
  },
});
