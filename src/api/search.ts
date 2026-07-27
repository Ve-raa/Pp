import { publicGet } from './client';
import type { SearchResult } from '../types';

const BASE = 'https://veraapp.app';

function fullUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  return path.startsWith('http') ? path : `${BASE}${path}`;
}

function mapService(raw: any) {
  const imageUrl = fullUrl(raw.image ?? raw.image_url ?? null);
  const gallery: string[] = Array.isArray(raw.gallery) && raw.gallery.length
    ? raw.gallery.map((g: string) => fullUrl(g) ?? g)
    : imageUrl ? [imageUrl] : [];
  return {
    id: String(raw.id),
    title: raw.title ?? '',
    description: raw.description,
    price: Number(raw.price ?? 0),
    currency: raw.currency ?? 'AED',
    images: gallery,
    image: imageUrl,
    rating: Number(raw.rating ?? 0),
    reviewsCount: raw.review_count ?? raw.reviewCount ?? 0,
    isAvailable: raw.is_active ?? true,
    isFeatured: raw.is_featured ?? false,
    provider: (raw.provider_name ?? raw.providerName)
      ? {
          id: String(raw.provider_id ?? raw.providerId ?? ''),
          name: raw.provider_name ?? raw.providerName,
          avatar: fullUrl(raw.provider_avatar ?? raw.providerAvatar),
          isVerified: raw.provider_verified ?? raw.providerVerified ?? false,
          city: raw.provider_city ?? raw.providerCity,
        }
      : undefined,
    badge: raw.badge ?? undefined,
  };
}

function empty(): SearchResult {
  return { services: [], providers: [], categories: [], total: 0 };
}

// ── بحث عادي عبر /api/search ─────────────────────────────────────────────────
export async function search(
  query: string,
  params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    country?: string;
    sort?: string;
  }
): Promise<SearchResult> {
  if (!query.trim()) return empty();
  try {
    const data = await publicGet<any>('/api/search', {
      q: query,
      ...(params as Record<string, unknown>),
    });
    const rawList: any[] =
      data?.results ?? data?.services ?? (Array.isArray(data) ? data : []);
    const services = rawList.map(mapService);
    return {
      services,
      providers: [],
      categories: [],
      total: data?.total ?? services.length,
    };
  } catch {
    return empty();
  }
}

// ── بحث ذكي بالـ AI — يفهم النية والسياق قبل الإرسال ───────────────────────
// يُحلّل الاستعلام ويستخرج النية الحقيقية، ثم يوسّع المصطلحات ذات الصلة
// ويرتّب النتائج حسب الصلة بالنية المكتشفة.
export async function smartSearch(
  query: string,
  params?: { page?: number; limit?: number; sort?: string },
): Promise<SearchResult> {
  if (!query.trim()) return empty();

  // ── اكتشاف النية والسياق ───────────────────────────────────────────────────
  const enrichedQuery = expandIntent(query);

  try {
    const data = await publicGet<any>('/api/search', {
      q: enrichedQuery,
      ai: '1',          // إشارة للخادم أن الطلب قادم من وضع البحث الذكي
      limit: params?.limit ?? 20,
      sort: params?.sort ?? 'rating',  // الذكاء يُفضّل الأعلى تقييماً افتراضياً
    });

    const rawList: any[] =
      data?.results ?? data?.services ?? (Array.isArray(data) ? data : []);
    const services = rawList.map(mapService);

    // ترتيب إضافي على مستوى التطبيق بناءً على كلمات مفتاحية من النية
    const intentKeywords = extractKeywords(query);
    const ranked = rankByIntent(services, intentKeywords);

    return {
      services: ranked,
      providers: [],
      categories: [],
      total: data?.total ?? ranked.length,
    };
  } catch {
    // fallback إلى البحث العادي إذا فشل مسار الذكاء
    return search(query, params);
  }
}

/** يُوسّع الاستعلام بمصطلحات ذات صلة بناءً على النية المكتشفة */
function expandIntent(query: string): string {
  const q = query.trim().toLowerCase();
  const expansions: Record<string, string[]> = {
    // خدمات المنزل
    'تنظيف': ['تنظيف منازل', 'نظافة', 'مكافحة حشرات'],
    'صيانة': ['إصلاح', 'تصليح', 'كهرباء', 'سباكة'],
    'نقل': ['شحن', 'توصيل أثاث', 'عفش'],
    // جمال وعناية
    'مكياج': ['تجميل', 'ميك أب', 'makeup'],
    'حلاقة': ['باربر', 'قص شعر', 'كوافير'],
    'عناية': ['تجميل', 'سبا', 'مساج'],
    // طعام
    'طبخ': ['طعام', 'طاهي', 'وجبات'],
    'كيك': ['حلويات', 'تورتة', 'حلوى'],
    // تقنية
    'تصميم': ['غرافيك', 'تصميم جرافيك', 'هوية بصرية'],
    'برمجة': ['تطوير', 'كود', 'موقع'],
    'موقع': ['ويب', 'تطوير مواقع', 'برمجة'],
    // تعليم
    'تدريس': ['دروس خصوصية', 'تعليم', 'مدرس'],
    'لغة': ['تعليم لغة', 'انجليزي', 'عربي'],
    // صحة
    'طبيب': ['صحة', 'استشارة طبية', 'علاج'],
    'رياضة': ['لياقة', 'تمارين', 'مدرب'],
    // تصوير
    'تصوير': ['فوتوغرافيا', 'مصور', 'فيديو'],
    'فيديو': ['مونتاج', 'تصوير', 'إنتاج'],
    // حيوانات
    'قط': ['حيوانات أليفة', 'رعاية حيوانات', 'بيطري'],
    'كلب': ['حيوانات أليفة', 'رعاية حيوانات', 'تدريب كلاب'],
  };

  for (const [keyword, extras] of Object.entries(expansions)) {
    if (q.includes(keyword)) {
      // أضف المصطلحات الأولى المرتبطة للإثراء
      return `${query} ${extras[0]}`;
    }
  }
  return query;
}

/** يستخرج الكلمات المفتاحية الرئيسية من الاستعلام */
function extractKeywords(query: string): string[] {
  const stopWords = new Set(['في', 'من', 'إلى', 'على', 'عن', 'مع', 'و', 'أو', 'هل', 'كيف', 'ما', 'أريد', 'أبحث', 'عن', 'محتاج', 'بحاجة']);
  return query
    .split(/\s+/)
    .map((w) => w.replace(/[^\u0600-\u06FFa-zA-Z]/g, '').toLowerCase())
    .filter((w) => w.length > 2 && !stopWords.has(w));
}

/** يرتّب الخدمات بناءً على مطابقة الكلمات المفتاحية للنية */
function rankByIntent(services: any[], keywords: string[]): any[] {
  if (!keywords.length) return services;
  return [...services].sort((a, b) => {
    const scoreA = intentScore(a, keywords);
    const scoreB = intentScore(b, keywords);
    return scoreB - scoreA;
  });
}

function intentScore(service: any, keywords: string[]): number {
  const text = `${service.title ?? ''} ${service.description ?? ''}`.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (text.includes(kw)) score += 2;
    if ((service.title ?? '').toLowerCase().includes(kw)) score += 3; // وزن أكبر للعنوان
  }
  // الخدمات الأعلى تقييماً تحصل على أولوية طفيفة
  score += (service.rating ?? 0) * 0.3;
  return score;
}

/** بحث يدوي بسيط — يستخدم /api/public/services بدل /api/search */
export async function manualSearch(
  query: string,
  params?: { page?: number; limit?: number; sort?: string },
): Promise<SearchResult> {
  if (!query.trim()) return empty();
  try {
    const data = await publicGet<any>('/api/public/services', {
      q: query,
      ...(params as Record<string, unknown>),
    });
    const rawList: any[] = data?.services ?? (Array.isArray(data) ? data : []);
    const services = rawList.map(mapService);
    return { services, providers: [], categories: [], total: data?.total ?? services.length };
  } catch {
    return empty();
  }
}

export async function getSearchSuggestions(query: string): Promise<string[]> {
  try {
    const data = await publicGet<any>('/api/search/suggestions', { q: query });
    return data ?? [];
  } catch {
    return [];
  }
}
