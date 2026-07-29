# VÉRA — دليل النشر على Google Play Store

هذا الدليل موجّه للمطوّر أو صاحب المشروع لنشر تطبيق VÉRA على Google Play Store من الصفر حتى الإطلاق.

---

## أولاً: إنشاء حساب Google Play Console

1. اذهب إلى [play.google.com/console](https://play.google.com/console) وسجّل دخولك بحساب Google.
2. اختر **Get started** وادفع رسوم التسجيل لمرة واحدة: **25 دولار أمريكي**.
3. أكمل بيانات حساب المطوّر (الاسم، البريد، رقم الهاتف).
4. انتظر التفعيل — عادةً يستغرق من ساعة إلى 48 ساعة.

---

## ثانياً: إعداد بيئة البناء

### المتطلبات
- Node.js 20 أو أحدث
- حساب على [expo.dev](https://expo.dev) مع تسجيل الدخول عبر `eas login`
- EAS CLI: `npm install -g eas-cli`

### تهيئة المشروع
```bash
git clone https://github.com/Ve-raa/Pp.git
cd Pp
yarn install
cp .env.example .env
```

افتح ملف `.env` وضع القيم الحقيقية:
```
EXPO_PUBLIC_API_URL=https://veraapp.app
EXPO_PUBLIC_STRIPE_KEY=pk_live_xxxxxxxxxxxx
```

---

## ثالثاً: بناء نسخة الإنتاج (AAB)

ملف AAB هو الصيغة التي يقبلها Google Play للتوزيع على المتاجر.

```bash
# تسجيل الدخول إلى EAS
eas login

# بناء نسخة الإنتاج
eas build --platform android --profile production
```

سيطلب منك EAS إنشاء **Keystore** (ملف توقيع التطبيق) في أول مرة — اختر **Generate new keystore** واحتفظ بالبيانات التي يعرضها بأمان، لأنك ستحتاجها في كل تحديث مستقبلي.

بعد انتهاء البناء (يستغرق 10-20 دقيقة)، حمّل ملف `.aab` من رابط EAS.

---

## رابعاً: إنشاء التطبيق في Play Console

1. في Play Console، اضغط **Create app**.
2. اختر اسم التطبيق: **VÉRA**، اللغة: **العربية**، النوع: **App**، مجاني/مدفوع حسب نموذج العمل.
3. اقرأ وقبل سياسات المطوّرين.

### إعداد الإصدار
1. من القائمة الجانبية اختر **Production → Releases → Create new release**.
2. ارفع ملف `.aab` الذي حمّلته من EAS.
3. اكتب ملاحظات الإصدار بالعربية، مثل: "الإصدار الأول من تطبيق VÉRA لخدمات المنزل".

---

## خامساً: ملء بيانات التطبيق

### معلومات التطبيق الأساسية (Store listing)
| الحقل | القيمة المقترحة |
|---|---|
| **اسم التطبيق** | VÉRA — خدمات منزلية |
| **الوصف القصير** | اطلب خدمات منزلية بضغطة واحدة مع ضمان الجودة |
| **الوصف الكامل** | منصة VÉRA تربطك بأفضل مزودي الخدمات المنزلية في الخليج... |
| **الفئة** | House & Home |

### الأصول البصرية المطلوبة
- **أيقونة التطبيق**: 512×512 بكسل PNG (موجودة في `assets/images/icon.png` — تحتاج تصدير بالمقاس المطلوب)
- **صورة الغلاف**: 1024×500 بكسل
- **لقطات الشاشة**: على الأقل 2 لقطة لكل فئة جهاز (هاتف / تابلت) — المقاسات المقبولة: 16:9 أو 9:16

### سياسة الخصوصية
مطلوبة إلزامياً. ارفعها على أي موقع (مثل صفحة على موقعك أو Notion) والصق الرابط في حقل **Privacy policy URL**.

---

## سادساً: إعداد التصنيف العمري

1. من القائمة: **Policy → App content → Target audience and content**.
2. أجب على أسئلة المحتوى بصدق — التطبيق موجّه للبالغين (18+).
3. احصل على التصنيف العمري (Rating) — سيُولَّد تلقائياً.

---

## سابعاً: مسار المراجعة والنشر

يُنصح باتباع هذا المسار:

```
Internal Testing (اختبار داخلي)
        ↓
Closed Testing / Alpha (اختبار محدود)
        ↓
Open Testing / Beta (اختبار مفتوح)
        ↓
Production (النشر الكامل)
```

لإطلاق أول مرة يمكنك القفز مباشرة إلى **Internal Testing** ثم **Production** بعد التأكد من عمل كل شيء.

---

## ثامناً: التحديثات المستقبلية

### تحديث عبر EAS (موصى به)
```bash
# تحديث فوري بدون انتظار مراجعة Google (OTA)
eas update --channel production --message "وصف التحديث"
```
يعمل هذا لتغييرات JavaScript فقط (شاشات، منطق، واجهة). أي تغيير في الكود الأصلي (Native) يتطلب build جديد.

### تحديث يتطلب build جديد
```bash
eas build --platform android --profile production
```
ثم ارفع الـ AAB الجديد في Play Console على **Production → Create new release**.

---

## ملاحظات مهمة

| الموضوع | التفاصيل |
|---|---|
| **مدة المراجعة** | أول إصدار: 3-7 أيام عمل. التحديثات اللاحقة: 1-3 أيام |
| **احتفظ بالـ Keystore** | إذا ضاع لا يمكن تحديث التطبيق أبداً — احفظه في مكانين منفصلين |
| **رقم الإصدار** | يُدار تلقائياً عبر `"appVersionSource": "remote"` في `eas.json` |
| **الأخطاء الشائعة** | رفض بسبب سياسة الخصوصية (تأكد من وجود رابط صالح) أو أذونات غير مبررة |
| **متطلبات Android** | التطبيق يستهدف Android 13+ وهو متوافق مع متطلبات Google الحالية |

---

## روابط مفيدة

- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction)
- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction)
- لوحة تحكم EAS: [expo.dev](https://expo.dev)
