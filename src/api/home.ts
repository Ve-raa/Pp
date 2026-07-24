import { publicGet } from './client';
import type { HomePageData, Banner, Service, Category, ServiceProvider } from '../types';

const BASE = 'https://veraapp.app';

function fullUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  return path.startsWith('http') ? path : `${BASE}${path}`;
}

// ─── Map raw API shapes to our types ─────────────────────────────────────────
function mapService(raw: any): Service {
  const imageUrl = fullUrl(raw.image_url ?? raw.image);
  const gallery: string[] = Array.isArray(raw.gallery) && raw.gallery.length
    ? raw.gallery.map((g: string) => fullUrl(g) ?? g)
    : imageUrl ? [imageUrl] : [];

  return {
    id: String(raw.id),
    title: raw.title ?? raw.name ?? '',
    description: raw.description,
    price: Number(raw.price ?? 0),
    currency: raw.currency ?? 'AED',
    images: gallery,
    image: imageUrl,
    rating: Number(raw.rating ?? 0),
    reviewsCount: raw.reviewCount ?? raw.review_count ?? 0,
    isAvailable: raw.is_active ?? true,
    isFeatured: raw.is_featured ?? false,
    deliveryTime: raw.deliveryTime,
    location: raw.providerCity ?? raw.provider_city ?? raw.location,
    provider: (raw.providerName ?? raw.provider_name)
      ? {
          id: String(raw.providerId ?? raw.provider_id ?? ''),
          name: raw.providerName ?? raw.provider_name,
          avatar: fullUrl(raw.providerAvatar ?? raw.provider_avatar),
          isVerified: raw.providerVerified ?? raw.provider_verified ?? false,
          city: raw.providerCity ?? raw.provider_city,
        }
      : undefined,
    discount: raw.discount,
    originalPrice: raw.originalPrice,
    viewsCount: raw.views ?? raw.view_count,
    ordersCount: raw.order_count,
    badge: raw.badge ?? undefined,
  } as Service;
}

function mapCategory(raw: any): Category {
  return {
    id: String(raw.id),
    name: raw.label_ar ?? raw.label ?? raw.name ?? '',
    nameAr: raw.label_ar ?? raw.nameAr,
    icon: raw.icon,
    image: fullUrl(raw.logo_url),
    color: raw.color_class ?? raw.color,
    servicesCount: raw.count ?? raw.servicesCount,
    slug: raw.slug ?? String(raw.id),
  };
}

function mapProvider(raw: any): ServiceProvider {
  return {
    id: String(raw.id),
    name: raw.name ?? '',
    avatar: fullUrl(raw.avatar),
    rating: Number(raw.rating ?? 0),
    isVerified: raw.verified ?? raw.isVerified ?? false,
    city: raw.city,
    servicesCount: raw.servicesCount,
  };
}

function mapBanner(raw: any): Banner {
  return {
    id: String(raw.id),
    title: raw.title,
    subtitle: raw.subtitle,
    image: fullUrl(raw.image_url) ?? raw.image ?? '',
    link: raw.link_url ?? raw.link,
    color: raw.color,
  };
}

// ─── Home Page ────────────────────────────────────────────────────────────────
export async function getHomePageData(): Promise<HomePageData> {
  const data = await publicGet<any>('/api/home/data');
  return {
    banners: (data.banners ?? []).map(mapBanner),
    featuredServices: (data.featuredServices ?? []).map(mapService),
    popularServices: (data.mostViewed ?? []).map(mapService),
    recentServices: (data.bestSellers ?? []).map(mapService),
    topCategories: (data.categories ?? []).map(mapCategory),
    topProviders: (data.merchants ?? []).map(mapProvider),
  };
}

export async function getBanners(): Promise<Banner[]> {
  const data = await publicGet<any>('/api/home/banners');
  const list = data?.banners ?? data ?? [];
  return list.map(mapBanner);
}

export async function getFeaturedServices(limit = 10): Promise<Service[]> {
  const data = await publicGet<any>('/api/home/data');
  return (data.featuredServices ?? []).slice(0, limit).map(mapService);
}

export async function getPopularServices(limit = 10): Promise<Service[]> {
  const data = await publicGet<any>('/api/home/data');
  return (data.mostViewed ?? []).slice(0, limit).map(mapService);
}

export async function getMostViewedServices(limit = 10): Promise<Service[]> {
  const data = await publicGet<any>('/api/home/data');
  return (data.mostViewed ?? []).slice(0, limit).map(mapService);
}

export async function getBestSellingServices(limit = 10): Promise<Service[]> {
  const data = await publicGet<any>('/api/home/data');
  return (data.bestSellers ?? []).slice(0, limit).map(mapService);
}
