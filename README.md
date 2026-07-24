# VÉRA — تطبيق الجوال

تطبيق React Native (Expo) لمنصة VÉRA — سوق إلكتروني متعدد التجار للخدمات المنزلية في منطقة الخليج.

## 🚀 تشغيل التطبيق

### المتطلبات
- Node.js 18+
- npm أو yarn
- Expo Go على جهازك (iOS أو Android)

### خطوات التشغيل

```bash
# 1. نسخ المستودع
git clone https://github.com/khalednaqib7-sketch/vera.git
cd vera

# 2. تثبيت الاعتماديات
npm install
# أو
yarn install

# 3. إنشاء ملف البيئة
cp .env.example .env
# عدّل القيم حسب الحاجة

# 4. تشغيل التطبيق
npx expo start
```

### خيارات التشغيل بعد `npx expo start`:
- اضغط `a` — فتح على محاكي Android
- اضغط `i` — فتح على محاكي iOS
- امسح QR Code — فتح على Expo Go على جهازك الحقيقي

## 📱 ميزات التطبيق

### تطبيق المشتري (Buyer)
- ✅ Splash + Onboarding
- ✅ تسجيل الدخول / إنشاء حساب
- ✅ الصفحة الرئيسية: أقسام، بانرات، خدمات مميزة وشائعة
- ✅ بحث متقدم مع فلترة
- ✅ تصفح الأقسام
- ✅ تفاصيل الخدمة + التقييمات
- ✅ السلة + أكواد الخصم
- ✅ الدفع: Stripe / Tabby / Tamara / محفظة
- ✅ طلباتي + تتبع الحالة
- ✅ المفضلة
- ✅ الملف الشخصي + المحفظة + برنامج الولاء
- ✅ الإشعارات
- ✅ صفحة الدعم

### تطبيق مزود الخدمة (Provider)
- ✅ تسجيل دخول / تسجيل مزود
- ✅ لوحة التحكم مع إحصاءات
- ✅ إدارة الخدمات (عرض + إضافة)
- ✅ إدارة الطلبات + تحديث الحالة
- ✅ الأرباح والمدفوعات
- ✅ الملف الشخصي

## 🔧 البنية التقنية

```
vera/
├── app/                    # Expo Router screens
│   ├── (auth)/             # شاشات المصادقة
│   ├── (buyer)/            # تطبيق المشتري (tabs)
│   ├── (provider)/         # تطبيق مزود الخدمة
│   ├── service/[id].tsx    # تفاصيل الخدمة
│   ├── order/[id].tsx      # تفاصيل الطلب
│   └── ...
├── src/
│   ├── api/                # Axios API modules
│   ├── constants/          # Colors, strings
│   ├── components/         # Reusable components
│   ├── store/              # Zustand state management
│   └── types/              # TypeScript types
├── assets/                 # Images, fonts
├── .env.example            # Environment variables template
└── README.md
```

## ⚙️ متغيرات البيئة

انسخ `.env.example` إلى `.env` وعدّل القيم:

```env
EXPO_PUBLIC_API_URL=https://veraapp.app
EXPO_PUBLIC_STRIPE_KEY=pk_live_xxxxx
```

## 🌐 API

Base URL: `https://veraapp.app`

المصادقة عبر JWT Bearer Token:
- مشتري: `POST /api/buyer-auth/login` → `buyer_token`
- مزود: `POST /api/provider-auth/login` → `provider_token`

راجع توثيق الـ API الكامل على: https://veraapp.app/downloads

## 🛡️ الأمان

- بيانات المصادقة تُحفظ بأمان في `expo-secure-store`
- لا توجد credentials في الكود — فقط environment variables
- HTTPS مطلوب لجميع API calls

## 🎨 الهوية البصرية

- اللون الأساسي: `#6366f1` (Indigo)
- اللون الثانوي: `#E91E8C` (Pink/Magenta)
- الخط: Cairo (Arabic Google Font)
- الاتجاه: RTL كامل (عربي)
