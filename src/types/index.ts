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
  /** Subcategory text as returned by /api/public/services */
  subcategory?: string;
}

// ─── Payment Types ────────────────────────────────────────────────────────────
export type PaymentMethod = 'stripe' | 'tabby' | 'tamara' | 'wallet';

export interface PaymentInitRequest {
  orderId: string;
  method: PaymentMethod;
  amount: number;
  buyerId: string;
  address?: string;
  fullName?: string;
  phone?: string;
  city?: string;
  district?: string;
  street?: string;
  buildingNumber?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PaymentInitResponse {
  paymentUrl?: string;
  paymentId?: string;
  clientSecret?: string;
  status: string;
  demo?: boolean;
  message?: string;
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
  bestSellingServices?: Service[];
  topCategories?: Category[];
  topProviders?: ServiceProvider[];
  /** @deprecated Use bestSellingServices. Kept for older screens. */
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

export interface PromoCodeResponse {
  isValid: boolean;
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  message?: string;
}

// ─── Order Types ──────────────────────────────────────────────────────────────
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export interface OrderItem {
  id: string;
  serviceId?: string;
  service?: Service;
  price: number;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber?: string;
  buyerId?: string;
  providerId?: string;
  serviceId?: string;
  service?: Service;
  status: OrderStatus;
  price: number;
  total?: number;
  subtotal?: number;
  discount?: number;
  items?: OrderItem[];
  paymentMethod?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded' | string;
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

export interface LoyaltyInfo extends LoyaltyData {
  tierName?: string;
  totalEarned?: number;
  totalRedeemed?: number;
  pointsToNextTier?: number;
}

export interface LoyaltyTransaction {
  id: string;
  type: 'earn' | 'earned' | 'redeemed' | 'expired';
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

export type Wallet = WalletData;

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  createdAt: string;
  balance?: number;
}

export interface Review {
  id: string;
  userName?: string;
  userAvatar?: string;
  rating: number;
  comment?: string;
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
