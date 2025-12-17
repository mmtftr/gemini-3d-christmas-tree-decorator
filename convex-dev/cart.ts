/**
 * Cart Functions
 *
 * These functions mimic Convex queries and mutations for shopping cart.
 */

import { Cart, CartItem, CartItemType, CartItemCustomization, calculateCartTotal } from '../types';

// Cart store with localStorage persistence
const STORAGE_KEY = 'christmas_tree_cart';
const cartStore: Map<string, Cart> = new Map();
let listeners: Set<() => void> = new Set();

// Load cart from localStorage on init
const loadFromStorage = () => {
  try {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as Record<string, Cart>;
      Object.entries(data).forEach(([key, cart]) => cartStore.set(key, cart));
    }
  } catch (e) {
    console.error('Failed to load cart from storage:', e);
  }
};

// Save cart to localStorage
const saveToStorage = () => {
  try {
    if (typeof window === 'undefined') return;
    const data: Record<string, Cart> = {};
    cartStore.forEach((cart, key) => (data[key] = cart));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save cart to storage:', e);
  }
};

// Initialize from localStorage
loadFromStorage();

const notifyListeners = () => {
  saveToStorage();
  listeners.forEach((l) => l());
};
const generateId = () => `cart_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
const generateItemId = () => `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

/**
 * Get cart for session
 * Convex: query({ args: { sessionId: v.string() }, handler: ... })
 */
export async function get(args: { sessionId: string }): Promise<Cart | null> {
  return cartStore.get(args.sessionId) || null;
}

/**
 * Add item to cart
 * Convex: mutation({ args: { sessionId, productType, productId, quantity, unitPrice, customization? }, handler: ... })
 */
export async function addItem(args: {
  sessionId: string;
  productType: CartItemType;
  productId: string;
  quantity: number;
  unitPrice: number;
  customization?: CartItemCustomization;
}): Promise<Cart> {
  let cart = cartStore.get(args.sessionId);

  const newItem: CartItem = {
    id: generateItemId(),
    productType: args.productType,
    productId: args.productId,
    quantity: args.quantity,
    unitPrice: args.unitPrice,
    customization: args.customization,
  };

  if (cart) {
    // Check if same product already exists (for trees/toppers, replace; for ornaments with same customization, update quantity)
    const existingIndex = cart.items.findIndex((item) => {
      if (item.productId !== args.productId) return false;
      if (args.productType === 'tree' || args.productType === 'topper') return true;
      // For ornaments, check customization matches
      if (args.productType === 'ornament' && args.customization) {
        return (
          item.customization?.color === args.customization.color &&
          JSON.stringify(item.customization?.position) === JSON.stringify(args.customization.position)
        );
      }
      return false;
    });

    if (existingIndex >= 0 && (args.productType === 'tree' || args.productType === 'topper')) {
      // Replace tree/topper
      cart.items[existingIndex] = newItem;
    } else {
      cart.items.push(newItem);
    }

    cart.subtotal = calculateCartTotal(cart.items);
    cart.updatedAt = Date.now();
  } else {
    cart = {
      id: generateId(),
      sessionId: args.sessionId,
      items: [newItem],
      subtotal: args.unitPrice * args.quantity,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    cartStore.set(args.sessionId, cart);
  }

  notifyListeners();
  return cart;
}

/**
 * Remove item from cart
 * Convex: mutation({ args: { sessionId, itemId }, handler: ... })
 */
export async function removeItem(args: { sessionId: string; itemId: string }): Promise<Cart | null> {
  const existingCart = cartStore.get(args.sessionId);
  if (!existingCart) return null;

  const newItems = existingCart.items.filter((item) => item.id !== args.itemId);

  // Create a new cart object to trigger React re-render
  const updatedCart: Cart = {
    ...existingCart,
    items: newItems,
    subtotal: calculateCartTotal(newItems),
    updatedAt: Date.now(),
  };

  cartStore.set(args.sessionId, updatedCart);
  notifyListeners();
  return updatedCart;
}

/**
 * Update item quantity
 * Convex: mutation({ args: { sessionId, itemId, quantity }, handler: ... })
 */
export async function updateQuantity(args: {
  sessionId: string;
  itemId: string;
  quantity: number;
}): Promise<Cart | null> {
  const existingCart = cartStore.get(args.sessionId);
  if (!existingCart) return null;

  let newItems: CartItem[];

  if (args.quantity <= 0) {
    // Remove item if quantity is 0 or negative
    newItems = existingCart.items.filter((i) => i.id !== args.itemId);
  } else {
    // Update quantity - create new item objects
    newItems = existingCart.items.map((item) =>
      item.id === args.itemId ? { ...item, quantity: args.quantity } : item
    );
  }

  // Create a new cart object to trigger React re-render
  const updatedCart: Cart = {
    ...existingCart,
    items: newItems,
    subtotal: calculateCartTotal(newItems),
    updatedAt: Date.now(),
  };

  cartStore.set(args.sessionId, updatedCart);
  notifyListeners();
  return updatedCart;
}

/**
 * Clear cart
 * Convex: mutation({ args: { sessionId }, handler: ... })
 */
export async function clear(args: { sessionId: string }): Promise<void> {
  cartStore.delete(args.sessionId);
  notifyListeners();
}

/**
 * Get cart item count
 */
export async function getItemCount(args: { sessionId: string }): Promise<number> {
  const cart = cartStore.get(args.sessionId);
  if (!cart) return 0;
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Check if cart has tree
 */
export async function hasTree(args: { sessionId: string }): Promise<boolean> {
  const cart = cartStore.get(args.sessionId);
  if (!cart) return false;
  return cart.items.some((item) => item.productType === 'tree');
}

/**
 * Get cart tree
 */
export async function getTree(args: { sessionId: string }): Promise<CartItem | null> {
  const cart = cartStore.get(args.sessionId);
  if (!cart) return null;
  return cart.items.find((item) => item.productType === 'tree') || null;
}

/**
 * Subscribe to cart changes
 */
export function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Reset cart store (for testing)
 */
export function _reset(): void {
  cartStore.clear();
  notifyListeners();
}
