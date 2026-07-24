import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';
import { Header } from '../src/components/common/Header';
import { Button } from '../src/components/common/Button';

const FAQS = [
  { q: 'كيف أتتبع طلبي؟', a: 'يمكنك تتبع طلبك من قسم "طلباتي" في قائمة حسابك. ستحصل أيضاً على إشعارات فورية عند تغيير حالة الطلب.' },
  { q: 'ما هي طرق الدفع المتاحة؟', a: 'نقبل بطاقات Visa وMastercard وMada عبر Stripe، بالإضافة إلى خدمتي Tabby وTamara للدفع المقسط، والمحفظة الإلكترونية.' },
  { q: 'كيف يمكنني إلغاء طلبي؟', a: 'يمكنك إلغاء الطلب من صفحة تفاصيل الطلب طالما لم يبدأ المزود في تنفيذه. إذا بدأ التنفيذ، يرجى التواصل مع الدعم الفني.' },
  { q: 'هل يمكنني استرداد المبلغ؟', a: 'نعم، في حالة الإلغاء قبل بدء التنفيذ يتم استرداد المبلغ كاملاً خلال 3-5 أيام عمل.' },
];

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || !subject.trim()) {
      Alert.alert('تنبيه', 'يرجى ملء جميع الحقول');
      return;
    }
    setSending(true);
    // Simulate send
    await new Promise((r) => setTimeout(r, 1500));
    setSending(false);
    setMessage('');
    setSubject('');
    Alert.alert('تم الإرسال ✅', 'تم إرسال رسالتك بنجاح. سيتواصل معك فريق الدعم خلال 24 ساعة.');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="الدعم الفني" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Quick Contact */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>تواصل معنا مباشرة</Text>
          <View style={styles.contactGrid}>
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => Linking.openURL('https://wa.me/966500000000')}
            >
              <View style={[styles.contactIcon, { backgroundColor: '#25D366' + '20' }]}>
                <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              </View>
              <Text style={styles.contactLabel}>واتساب</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => Linking.openURL('mailto:support@veraapp.app')}
            >
              <View style={[styles.contactIcon, { backgroundColor: Colors.primary + '20' }]}>
                <Ionicons name="mail-outline" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.contactLabel}>البريد الإلكتروني</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => Linking.openURL('tel:+966500000000')}
            >
              <View style={[styles.contactIcon, { backgroundColor: Colors.info + '20' }]}>
                <Ionicons name="call-outline" size={24} color={Colors.info} />
              </View>
              <Text style={styles.contactLabel}>اتصال مباشر</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Message form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>أرسل رسالة</Text>
          <Text style={styles.inputLabel}>الموضوع</Text>
          <TextInput
            style={styles.input}
            placeholder="اكتب موضوع الرسالة..."
            placeholderTextColor={Colors.textLight}
            value={subject}
            onChangeText={setSubject}
            textAlign="right"
          />
          <Text style={styles.inputLabel}>الرسالة</Text>
          <TextInput
            style={[styles.input, styles.messageInput]}
            placeholder="اكتب رسالتك هنا..."
            placeholderTextColor={Colors.textLight}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            textAlign="right"
            textAlignVertical="top"
          />
          <Button title="إرسال الرسالة" onPress={handleSend} loading={sending} fullWidth />
        </View>

        {/* FAQs */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>الأسئلة الشائعة</Text>
          {FAQS.map((faq, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setExpandedFaq(expandedFaq === i ? null : i)}
              style={styles.faqItem}
            >
              <Ionicons
                name={expandedFaq === i ? 'chevron-down' : 'chevron-back'}
                size={16}
                color={Colors.purpleMid}
              />
              <View style={styles.faqContent}>
                {expandedFaq === i && (
                  <Text style={styles.faqAnswer}>{faq.a}</Text>
                )}
                <Text style={styles.faqQuestion}>{faq.q}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Terms */}
        <View style={styles.linksCard}>
          <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('https://veraapp.app/public/terms')}>
            <Ionicons name="chevron-back" size={16} color={Colors.border} />
            <Text style={styles.linkText}>شروط الاستخدام</Text>
            <Ionicons name="document-text-outline" size={18} color={Colors.purpleMid} />
          </TouchableOpacity>
          <View style={styles.linkDivider} />
          <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('https://veraapp.app')}>
            <Ionicons name="chevron-back" size={16} color={Colors.border} />
            <Text style={styles.linkText}>الموقع الرسمي</Text>
            <Ionicons name="globe-outline" size={18} color={Colors.purpleMid} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  card: { margin: 16, marginBottom: 0, marginTop: 16, backgroundColor: Colors.cardBg, borderRadius: 16, padding: 16 },
  cardTitle: { fontFamily: 'Cairo_700Bold', fontSize: 16, color: Colors.textPrimary, textAlign: 'right', marginBottom: 14 },
  contactGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  contactItem: { alignItems: 'center', gap: 8 },
  contactIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  contactLabel: { fontFamily: 'Cairo_600SemiBold', fontSize: 12, color: Colors.textPrimary, textAlign: 'center' },
  inputLabel: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: Colors.purpleDark, textAlign: 'right', marginBottom: 6 },
  input: { backgroundColor: Colors.lightPurple, borderRadius: 12, padding: 12, fontFamily: 'Cairo_400Regular', fontSize: 14, color: Colors.textPrimary, marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
  messageInput: { minHeight: 100 },
  faqItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 8 },
  faqContent: { flex: 1 },
  faqQuestion: { fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: Colors.textPrimary, textAlign: 'right', lineHeight: 22 },
  faqAnswer: { fontFamily: 'Cairo_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'right', lineHeight: 22, marginTop: 6, marginBottom: 6, backgroundColor: Colors.lightPurple, padding: 10, borderRadius: 10 },
  linksCard: { margin: 16, marginBottom: 0, marginTop: 16, backgroundColor: Colors.cardBg, borderRadius: 16, overflow: 'hidden' },
  linkRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 8 },
  linkText: { flex: 1, fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: Colors.textPrimary, textAlign: 'right' },
  linkDivider: { height: 1, backgroundColor: Colors.border },
});
