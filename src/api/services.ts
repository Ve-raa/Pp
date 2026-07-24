import { publicGet, buyerGet, buyerPost, buyerDelete } from './client';
import type { Service, Review } from '../types';

const BASE = 'https://veraapp.app';

function fullUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  return path.startsWith('http') ? path : `${BASE}${path}`;
}

// ─── Map raw service from public API (list) ───────────────────────────────────
function mapService(raw: any): Service {
  const imageUrl = fullUrl(raw.image_url);
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
    deliveryTime: raw.deliveryTime,
    location: raw.provider_city ?? raw.location,
    provider: raw.provider_name
      ? {
          id: String(raw.provider_id ?? ''),
          name: raw.provider_name,
          avatar: fullUrl(raw.provider_avatar),
          isVerified: raw.provider_verified ?? false,
          city: raw.provider_city,
        }
      : undefined,
    viewsCount: raw.view_count,
    ordersCount: raw.order_count,
    badge: raw.badge ?? undefined,
  } as Service;
}

// ─── Map raw service from detail API ─────────────────────────────────────────
function mapDetailService(raw: any): Service {
  const imageUrl = fullUrl(raw.image);
  const gallery: string[] = Array.isArray(raw.gallery) && raw.gallery.length
    ? raw.gallery.map((g: string) => fullUrl(g) ?? g)
    : imageUrl ? [imageUrl] : [];

  return {
    id: String(raw.id),
    title: raw.title ?? '',
    description: raw.description ?? raw.longDescription,
    price: Number(raw.price ?? 0),
    currency: raw.currency ?? 'AED',
    images: gallery,
    image: imageUrl,
    rating: Number(raw.rating ?? 0),
    reviewsCount: raw.reviewCount ?? 0,
    isAvailable: raw.status === 'approved' ? true : (raw.is_active ?? true),
    isFeatured: raw.isFeatured ?? false,
    deliveryTime: raw.deliveryTime,
    location: raw.providerCity ?? raw.location,
    provider: raw.providerName
      ? {
          id: String(raw.providerId ?? ''),
          name: raw.providerName ?? '',
          avatar: fullUrl(raw.providerAvatar),
          rating: Number(raw.providerRating ?? 0),
          reviewsCount: raw.providerReviewCount ?? 0,
          isVerified: raw.providerVerified ?? false,
          city: raw.providerCity,
          bio: raw.providerBio,
        }
      : undefined,
    tags: raw.tags ?? [],
    badge: raw.badge ?? undefined,
  } as Service;
}

// ─── Services List ────────────────────────────────────────────────────────────
export async function getServices(params?: {
  page?: number;
  limit?: number;
  categoryId?: string;
  providerId?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  country?: string;
}): Promise<{ services: Service[]; total: number; page: number; totalPages: number }> {
  const data = await publicGet<any>('/api/public/services', params as Record<string, unknown>);
  const services = (data?.services ?? data ?? []).map(mapService);
  return {
    services,
    total: data?.total ?? services.length,
    page: data?.page ?? 1,
    totalPages: data?.totalPages ?? 1,
  };
}

export async function getServiceById(id: string): Promise<Service> {
  const data = await publicGet<any>(`/api/services/${id}`);
  // Backend returns { service: {...}, reviews: [...], related: [...] }
  const raw = data?.service ?? data;
  return mapDetailService(raw);
}

export async function getServiceReviews(
  serviceId: string,
  page = 1,
  limit = 10
): Promise<{ reviews: Review[]; total: number; averageRating: number }> {
  try {
    const data = await publicGet<any>(`/api/reviews/${serviceId}`, { page, limit });
    return {
      reviews: data?.reviews ?? data ?? [],
      total: data?.total ?? 0,
      averageRating: data?.averageRating ?? 0,
    };
  } catch {
    return { reviews: [], total: 0, averageRating: 0 };
  }
}

// ─── Wishlist ─────────────────────────────────────────────────────────────────
export async function getWishlist(): Promise<Service[]> {
  const data = await buyerGet<any>('/api/buyer/wishlist');
  return (data?.items ?? data?.services ?? data ?? []).map(mapService);
}

export async function addToWishlist(serviceId: string): Promise<{ message: string }> {
  return buyerPost('/api/buyer/wishlist', { serviceId });
}

export async function removeFromWishlist(serviceId: string): Promise<{ message: string }> {
  return buyerDelete(`/api/buyer/wishlist/${serviceId}`);
}
