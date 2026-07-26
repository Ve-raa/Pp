// ─── Auth Types ───────────────────────────────────────────────────────────────
export interface BuyerUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  country?: string;
  city?: string;
  loyaltyPoints?: number;
  walletBalance?: number;
  createdAt?: string;
}

export interface ProviderUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  businessName?: string;
  country?: string;
  city?: string;
  rating?: number;
  totalOrders?: number;
  isVerified?: boolean;
  subscriptionPlan?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterBuyerRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  country?: string;
}

export interface RegisterProviderRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  businessName: string;
  country: string;
  city: string;
  categoryId?: string;
}

export interface AuthResponse {
  token: string;
  user: BuyerUser | ProviderUser;
}

// ─── Category Types ───────────────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  nameAr?: string;
  icon?: string;
  image?: string;
  color?: string;
  servicesCount?: number;
  slug?: string;
}

// ─── Service / Product Types ──────────────────────────────────────────────────
export interface Service {
  id: string;
  title: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  price: number;
  currency?: string;
  images: string[];
  image?: string;
  categoryId?: string;
  category?: Category;
  providerId?: string;
  provider?: ServiceProvider;
  rating?: number;
  reviewsCount?: number;
  isAvailable?: boolean;
  isFeatured?: boolean;
  deliveryTime?: string;
  location?: string;
  country?: string;
  tags?: string[];
  discount?: number;
  originalPrice?: number;
  viewsCount?: number;
  ordersCount?: number;
  /** Promotional badge label (e.g. 'جديد', 'الأكثر طلباً') */
  badge?: string;
}

export interface ServiceProvider {
  id: string;
  name: string;
  avatar?: string;
  rating?: number;
  reviewsCount?: number;
  isVerified?: boolean;
  country?: string;
  city?: string;
  bio?: string;
  servicesCount?: number;
  category?: string;
}

// ─── Home Page Types ──────────────────────────────────────────────────────────
export interface Banner {
  id: string;
  title?: string;
  subtitle?: string;
  image: string;
  link?: string;
  color?: string;
}

/** Per-section banners managed from the admin panel */
export interface SectionBanner {
  id: string;
  sectionKey: HomeSectionKey;
  image: string;
  link?: string;
  title?: string;
  createdAt: string;
}

export type HomeSectionKey =
  | 'featured'
  | 'popular'
  | 'best_sellers'
  | 'top_providers';

export interface HomePageData {
  banners?: Banner[];
  featuredServices?: Service[];
  popularServices?: Service[];
  topCategories?: Category[];
  topProviders?: ServiceProvider[];
  recentServices?: Service[];
}

// ─── Cart Types ───────────────────────────────────────────────────────────────
export interface CartItem {
  id: string;
  serviceId: string;
  service: Service;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Cart {
  id?: string;
  items: CartItem[];
  subtotal: number;
  discount?: number;
  total: number;
  promoCode?: string;
}

// ─── Order Types ──────────────────────────────────────────────────────────────
export interface Order {
  id: string;
  buyerId?: string;
  providerId?: string;
  serviceId?: string;
  service?: Service;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  price: number;
  currency?: string;
  notes?: string;
  scheduledAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
  rating?: number;
  review?: string;
}

// ─── Notification Types ───────────────────────────────────────────────────────
export interface Notification {
  id: string;
  title: string;
  body: string;
  type?: string;
  isRead?: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

// ─── Loyalty Types ────────────────────────────────────────────────────────────
export interface LoyaltyData {
  points: number;
  tier?: string;
  nextTier?: string;
  pointsToNextTier?: number;
  history?: LoyaltyTransaction[];
}

export interface LoyaltyTransaction {
  id: string;
  type: 'earned' | 'redeemed' | 'expired';
  points: number;
  description: string;
  createdAt: string;
}

// ─── Wallet Types ─────────────────────────────────────────────────────────────
export interface WalletData {
  balance: number;
  currency?: string;
  transactions?: WalletTransaction[];
}

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  createdAt: string;
}

// ─── Provider Dashboard Types ─────────────────────────────────────────────────
export interface ProviderDashboard {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalEarnings: number;
  thisMonthEarnings: number;
  rating: number;
  reviewsCount: number;
  activeServices: number;
  recentOrders?: Order[];
}

export interface ProviderEarnings {
  totalEarnings: number;
  pendingPayout: number;
  paidOut: number;
  thisMonth: number;
  lastMonth: number;
  transactions: EarningTransaction[];
}

export interface EarningTransaction {
  id: string;
  type: 'earning' | 'payout';
  amount: number;
  description: string;
  orderId?: string;
  status: 'pending' | 'paid' | 'processing';
  createdAt: string;
}

// ─── Search Types ─────────────────────────────────────────────────────────────
export interface SearchResult {
  services: Service[];
  providers: ServiceProvider[];
  categories: Category[];
  total: number;
}

// ─── API Response Wrapper ─────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
  pagination?: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}
