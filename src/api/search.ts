import { publicGet } from './client';
import type { SearchResult } from '../types';

const BASE = 'https://veraapp.app';

function fullUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  return path.startsWith('http') ? path : `${BASE}${path}`;
}

function mapService(raw: any) {
  // /api/search returns providerName, image (not image_url) and nested provider_* fields
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
    // /api/search returns { results: [...] }; fall back to services/array shapes too
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

export async function smartSearch(query: string): Promise<SearchResult> {
  return search(query);
}

export async function getSearchSuggestions(query: string): Promise<string[]> {
  try {
    const data = await publicGet<any>('/api/search/suggestions', { q: query });
    return data ?? [];
  } catch {
    return [];
  }
}
