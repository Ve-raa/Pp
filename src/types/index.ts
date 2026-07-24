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
  promoDiscount?: number;
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

export type PaymentMethod = 'stripe' | 'tabby' | 'tamara' | 'wallet' | 'cash';

export interface OrderItem {
  id: string;
  serviceId: string;
  service: Service;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  items: OrderItem[];
  subtotal: number;
  discount?: number;
  total: number;
  promoCode?: string;
  notes?: string;
  address?: string;
  providerId?: string;
  provider?: ServiceProvider;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  rating?: number;
  review?: string;
}

export interface PaymentInitRequest {
  orderId: string;
  method: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PaymentInitResponse {
  paymentUrl?: string;
  paymentId?: string;
  clientSecret?: string;
}

// ─── Wallet Types ─────────────────────────────────────────────────────────────
export interface Wallet {
  id?: string;
  balance: number;
  currency: string;
  pendingBalance?: number;
}

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  orderId?: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
}

// ─── Loyalty Types ────────────────────────────────────────────────────────────
export interface LoyaltyTier {
  name: string;
  minPoints: number;
  maxPoints?: number;
  color: string;
  icon: string;
  benefits?: string[];
}

export interface LoyaltyHistoryItem {
  id: string;
  type: 'earned' | 'redeemed' | 'expired';
  points: number;
  description: string;
  orderId?: string;
  createdAt: string;
}

export interface LoyaltyInfo {
  points: number;
  tier: string;
  tierColor?: string;
  tierIcon?: string;
  nextTier?: string;
  pointsToNextTier?: number;
  totalEarned?: number;
  totalRedeemed?: number;
  history?: LoyaltyHistoryItem[];
  tiers?: LoyaltyTier[];
}

// ─── Notification Types ───────────────────────────────────────────────────────
export interface Notification {
  id: string;
  title: string;
  body: string;
  type?: 'order' | 'payment' | 'promo' | 'system' | 'general';
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

// ─── Review Types ─────────────────────────────────────────────────────────────
export interface Review {
  id: string;
  rating: number;
  comment?: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  serviceId?: string;
  orderId?: string;
  createdAt: string;
}

// ─── Provider Dashboard ───────────────────────────────────────────────────────
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
