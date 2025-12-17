/**
 * Order Functions
 *
 * These functions mimic Convex queries and mutations for orders.
 */

import { Order, OrderStatus, Cart, ShippingAddress, TreeConfig, OrnamentData, TreeTopperData } from '../types';

// In-memory orders store
const ordersStore: Map<string, Order[]> = new Map();
let listeners: Set<() => void> = new Set();

const notifyListeners = () => listeners.forEach((l) => l());
const generateId = () => `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

/**
 * Create a new order
 * Convex: mutation({ args: { ... }, handler: ... })
 */
export async function create(args: {
  sessionId: string;
  cartSnapshot: Cart;
  shippingAddress: ShippingAddress;
  stripeSessionId: string;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  treeConfigSnapshot: TreeConfig;
  ornamentsSnapshot: OrnamentData[];
  topperSnapshot: TreeTopperData | null;
}): Promise<Order> {
  const order: Order = {
    id: generateId(),
    sessionId: args.sessionId,
    cartSnapshot: args.cartSnapshot,
    shippingAddress: args.shippingAddress,
    stripeSessionId: args.stripeSessionId,
    status: 'pending',
    subtotal: args.subtotal,
    shippingCost: args.shippingCost,
    tax: args.tax,
    total: args.total,
    treeConfigSnapshot: args.treeConfigSnapshot,
    ornamentsSnapshot: args.ornamentsSnapshot,
    topperSnapshot: args.topperSnapshot,
    createdAt: Date.now(),
  };

  const sessionOrders = ordersStore.get(args.sessionId) || [];
  sessionOrders.push(order);
  ordersStore.set(args.sessionId, sessionOrders);

  notifyListeners();
  return order;
}

/**
 * Update order status
 * Convex: mutation({ args: { stripeSessionId, status, stripePaymentIntentId? }, handler: ... })
 */
export async function updateStatus(args: {
  stripeSessionId: string;
  status: OrderStatus;
  stripePaymentIntentId?: string;
}): Promise<Order | null> {
  // Find order by stripeSessionId
  for (const [sessionId, orders] of ordersStore) {
    const order = orders.find((o) => o.stripeSessionId === args.stripeSessionId);
    if (order) {
      order.status = args.status;
      if (args.stripePaymentIntentId) {
        order.stripePaymentIntentId = args.stripePaymentIntentId;
      }
      if (args.status === 'paid') {
        order.paidAt = Date.now();
      } else if (args.status === 'shipped') {
        order.shippedAt = Date.now();
      } else if (args.status === 'delivered') {
        order.deliveredAt = Date.now();
      }
      notifyListeners();
      return order;
    }
  }
  return null;
}

/**
 * Get orders by session
 * Convex: query({ args: { sessionId }, handler: ... })
 */
export async function getBySession(args: { sessionId: string }): Promise<Order[]> {
  return ordersStore.get(args.sessionId) || [];
}

/**
 * Get single order by ID
 * Convex: query({ args: { orderId }, handler: ... })
 */
export async function getById(args: { orderId: string }): Promise<Order | null> {
  for (const orders of ordersStore.values()) {
    const order = orders.find((o) => o.id === args.orderId);
    if (order) return order;
  }
  return null;
}

/**
 * Get order by Stripe session ID
 * Convex: query({ args: { stripeSessionId }, handler: ... })
 */
export async function getByStripeSession(args: { stripeSessionId: string }): Promise<Order | null> {
  for (const orders of ordersStore.values()) {
    const order = orders.find((o) => o.stripeSessionId === args.stripeSessionId);
    if (order) return order;
  }
  return null;
}

/**
 * Subscribe to order changes
 */
export function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Reset orders store (for testing)
 */
export function _reset(): void {
  ordersStore.clear();
  notifyListeners();
}
