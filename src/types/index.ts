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
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  isValid: boolean;
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

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  total: number;
  discount?: number;
  promoCode?: string;
  paymentMethod?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  estimatedDelivery?: string;
  providerId?: string;
  provider?: ServiceProvider;
  rating?: number;
  review?: string;
  trackingUrl?: string;
}

export interface OrderItem {
  id: string;
  serviceId: string;
  service: Service;
  quantity: number;
  price: number;
  notes?: string;
}

// ─── Wallet Types ─────────────────────────────────────────────────────────────
export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  currency?: string;
  description: string;
  createdAt: string;
  balance?: number;
  referenceId?: string;
}

export interface Wallet {
  balance: number;
  currency: string;
  transactions: WalletTransaction[];
}

// ─── Loyalty Types ────────────────────────────────────────────────────────────
export interface LoyaltyInfo {
  points: number;
  tier: string;
  tierName?: string;
  nextTier?: string;
  pointsToNextTier?: number;
  totalEarned?: number;
  totalRedeemed?: number;
  expiryDate?: string;
  history?: LoyaltyTransaction[];
}

export interface LoyaltyTransaction {
  id: string;
  type: 'earn' | 'redeem';
  points: number;
  description: string;
  createdAt: string;
}

// ─── Notification Types ───────────────────────────────────────────────────────
export interface Notification {
  id: string;
  title: string;
  body: string;
  type?: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

// ─── Review Types ─────────────────────────────────────────────────────────────
export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  serviceId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  images?: string[];
}

// ─── Payment Types ────────────────────────────────────────────────────────────
export type PaymentMethod = 'stripe' | 'tabby' | 'tamara' | 'wallet' | 'cash';

export interface PaymentInitRequest {
  orderId: string;
  method: PaymentMethod;
  returnUrl?: string;
}

export interface PaymentInitResponse {
  paymentUrl?: string;
  clientSecret?: string;
  sessionId?: string;
  status: string;
}

// ─── Provider Types ───────────────────────────────────────────────────────────
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
