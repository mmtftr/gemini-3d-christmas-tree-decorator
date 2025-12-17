// ============================================
// ORNAMENT TYPES
// ============================================

// Currently available ornaments (procedural geometry + GLB models)
export const ORNAMENT_TYPES = [
  'sphere',
  'cube',
  'diamond',
  'giftBox',
  'snowflake',
  'heart',
  'gift1',
  'gift2',
  'gift3',
  'ball',
  'bell',
  'redball',
] as const;

export type OrnamentType = typeof ORNAMENT_TYPES[number];

// Placeholder for future GLB-based ornaments
export const FUTURE_ORNAMENT_TYPES = [
  'star',
  'candyCane',
  'bell',
  'icicle',
  'gingerbread',
  'ribbon',
] as const;

export const ORNAMENT_CATEGORIES = {
  classic: ['sphere', 'diamond', 'ball', 'redball'],
  shapes: ['cube', 'heart'],
  festive: ['giftBox', 'snowflake', 'bell'],
  gifts: ['gift1', 'gift2', 'gift3'],
} as const;

export type OrnamentCategory = keyof typeof ORNAMENT_CATEGORIES;

// ============================================
// ORNAMENT DATA (prepared for multi-user)
// ============================================

export interface OrnamentData {
  id: string;
  type: OrnamentType;
  color: string;
  position: [number, number, number];
  scale: number;
  rotation?: [number, number, number];

  // Multi-user fields (will be populated by Convex)
  userId?: string;
  userName?: string;
  createdAt?: number;
}

// ============================================
// TREE TOPPER
// ============================================

export type TopperType = 'star' | 'snowflake';

export interface TreeTopperData {
  id: string;
  type: TopperType;
  color: string;
  scale: number;
  glow: boolean;

  // Multi-user fields
  userId?: string;
  userName?: string;
  createdAt?: number;
}

// ============================================
// TREE CONFIGURATION
// ============================================

export interface TreeConfig {
  seed: number;
  height: number;
  radius: number;
  tiers: number;
  color: string;
  snowAmount: number;
}

// ============================================
// AUTHENTICATION TYPES
// ============================================

/**
 * User for authentication - contains password hash
 * NOTE: Never send passwordHash to the client
 */
export interface User {
  id: string;
  email: string;
  passwordHash: string;  // Hashed password - never expose to client
  name?: string;
  avatarUrl?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Auth session - represents an active login
 */
export interface AuthSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: number;
  createdAt: number;
}

/**
 * Signup request data
 */
export interface SignupData {
  email: string;
  password: string;
  name?: string;
}

/**
 * Login request data
 */
export interface LoginData {
  email: string;
  password: string;
}

/**
 * Auth operation result
 */
export interface AuthResult {
  success: boolean;
  error?: string;
  token?: string;
  user?: Omit<User, 'passwordHash'>;
}

// ============================================
// USER PROFILE & QUOTAS (prepared for Convex + payments)
// ============================================

/**
 * User profile - safe version without password
 * Use this for client-side state
 */
export interface UserProfile {
  id: string;
  name?: string;
  email: string;
  avatarUrl?: string;

  // Quota tracking
  quota: UserQuota;

  // Subscription tier
  tier: 'free' | 'basic' | 'premium' | 'unlimited';
}

export interface UserQuota {
  maxOrnaments: number;
  usedOrnaments: number;
  maxToppers: number;
  usedToppers: number;

  // Premium features
  canUseSpecialOrnaments: boolean;
  canUseCustomColors: boolean;
  canUseAnimations: boolean;
}

export const DEFAULT_QUOTAS: Record<User['tier'], Omit<UserQuota, 'usedOrnaments' | 'usedToppers'>> = {
  free: {
    maxOrnaments: 10,
    maxToppers: 1,
    canUseSpecialOrnaments: false,
    canUseCustomColors: false,
    canUseAnimations: false,
  },
  basic: {
    maxOrnaments: 50,
    maxToppers: 1,
    canUseSpecialOrnaments: true,
    canUseCustomColors: true,
    canUseAnimations: false,
  },
  premium: {
    maxOrnaments: 200,
    maxToppers: 3,
    canUseSpecialOrnaments: true,
    canUseCustomColors: true,
    canUseAnimations: true,
  },
  unlimited: {
    maxOrnaments: Infinity,
    maxToppers: Infinity,
    canUseSpecialOrnaments: true,
    canUseCustomColors: true,
    canUseAnimations: true,
  },
};

// ============================================
// SHARED TREE SESSION (for multi-user collab)
// ============================================

export interface TreeSession {
  id: string;
  name: string;
  ownerId: string;

  // Tree state
  treeConfig: TreeConfig;
  topper?: TreeTopperData;

  // Sharing
  isPublic: boolean;
  inviteCode?: string;

  // Metadata
  createdAt: number;
  updatedAt: number;
}

export interface SessionParticipant {
  sessionId: string;
  userId: string;
  userName: string;
  avatarUrl?: string;
  role: 'owner' | 'editor' | 'viewer';
  joinedAt: number;
  isOnline: boolean;
  cursorPosition?: [number, number, number];
}

// ============================================
// AI THEME GENERATION
// ============================================

export enum ThemeType {
  CLASSIC = 'classic',
  FROZEN = 'frozen',
  CANDY = 'candy',
  GOLDEN = 'golden',
  MIDNIGHT = 'midnight'
}

export interface GeneratedTheme {
  treeColor: string;
  ornamentColors: string[];
  snowAmount: number;
  backgroundColor: string;
  description: string;
}

// ============================================
// UI STATE
// ============================================

export type EditorMode = 'view' | 'decorate' | 'topper' | 'edit';
export type TransformMode = 'translate' | 'rotate';

export interface EditorState {
  mode: EditorMode;
  selectedOrnamentType: OrnamentType;
  selectedTopperType: TopperType;
  selectedColor: string;
  activePlacement: [number, number, number] | null;
  selectedOrnamentId: string | null;
  transformMode: TransformMode;
}

// ============================================
// REAL-TIME EVENTS (for Convex subscriptions)
// ============================================

export type OrnamentEvent =
  | { type: 'ornament_added'; ornament: OrnamentData }
  | { type: 'ornament_removed'; ornamentId: string }
  | { type: 'ornament_updated'; ornament: OrnamentData }
  | { type: 'topper_changed'; topper: TreeTopperData | null }
  | { type: 'tree_config_changed'; config: TreeConfig }
  | { type: 'participant_joined'; participant: SessionParticipant }
  | { type: 'participant_left'; participantId: string }
  | { type: 'cursor_moved'; userId: string; position: [number, number, number] };

// ============================================
// E-COMMERCE TYPES
// ============================================

export type TreeSize = 'small' | 'medium' | 'large';

export interface ProductPrice {
  amount: number;        // Price in cents (e.g., 4900 = CHF 49.00)
  currency: string;      // 'chf'
  stripePriceId: string; // Stripe Price ID for checkout
}

export interface TreeProduct {
  id: string;
  name: string;
  size: TreeSize;
  heightFt: number;        // 4, 6, or 8
  description: string;
  price: ProductPrice;
  imageUrl?: string;
  inStock: boolean;
  leadTimeDays: number;    // 5-7, 7-10, 10-14
}

export interface OrnamentProduct {
  id: string;
  type: OrnamentType;
  name: string;
  description: string;
  price: ProductPrice;
  category: OrnamentCategory;
  imageUrl?: string;
  inStock: boolean;
}

export interface TopperProduct {
  id: string;
  type: TopperType;
  name: string;
  description: string;
  price: ProductPrice;
  imageUrl?: string;
  inStock: boolean;
}

// ============================================
// SHOPPING CART
// ============================================

export type CartItemType = 'tree' | 'ornament' | 'topper';

export interface CartItemCustomization {
  color: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export interface CartItem {
  id: string;              // Unique cart item ID
  productType: CartItemType;
  productId: string;       // Reference to product
  quantity: number;
  unitPrice: number;       // Price in cents at time of adding
  customization?: CartItemCustomization;
}

export interface Cart {
  id: string;
  sessionId: string;
  items: CartItem[];
  subtotal: number;        // In cents
  createdAt: number;
  updatedAt: number;
}

// ============================================
// CHECKOUT & ORDERS
// ============================================

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string;
  sessionId: string;
  cartSnapshot: Cart;
  shippingAddress: ShippingAddress;
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  treeConfigSnapshot: TreeConfig;
  ornamentsSnapshot: OrnamentData[];
  topperSnapshot: TreeTopperData | null;
  createdAt: number;
  paidAt?: number;
  shippedAt?: number;
  deliveredAt?: number;
}

export interface CheckoutRequest {
  cartId: string;
  shippingAddress: ShippingAddress;
  treeConfig: TreeConfig;
  ornaments: OrnamentData[];
  topper: TreeTopperData | null;
}

// ============================================
// PRICE UTILITIES
// ============================================

export function formatPrice(cents: number): string {
  return `CHF ${(cents / 100).toFixed(2)}`;
}

export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}
