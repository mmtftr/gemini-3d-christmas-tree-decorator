import { useCallback, useMemo } from 'react';
import { Cart, TreeProduct, OrnamentProduct, TopperProduct, formatPrice } from '../types';
import { getSessionId } from './sessionStore';
import { useQuery, useMutation } from '../lib/convex';
import { api } from '../convex/_generated/api';

export interface CartStore {
  cart: Cart | null;
  isLoading: boolean;
  itemCount: number;
  subtotal: number;
  formattedSubtotal: string;
  hasTree: boolean;

  addTreeToCart: (product: TreeProduct) => Promise<void>;
  addOrnamentToCart: (
    product: OrnamentProduct,
    color: string,
    position?: [number, number, number]
  ) => Promise<void>;
  addTopperToCart: (product: TopperProduct, color: string) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

export function useCartStore(): CartStore {
  const sessionId = getSessionId();

  // Queries
  const cart = useQuery(api.cart.get, { sessionId });
  const isLoading = cart === undefined;

  // Mutations
  const addItemMutation = useMutation(api.cart.addItem);
  const removeItemMutation = useMutation(api.cart.removeItem);
  const updateQuantityMutation = useMutation(api.cart.updateQuantity);
  const clearMutation = useMutation(api.cart.clear);

  // Derived values
  const itemCount = useMemo(() => {
    if (!cart) return 0;
    return cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
  }, [cart]);

  const subtotal = cart?.subtotal || 0;
  const formattedSubtotal = formatPrice(subtotal);

  const hasTree = useMemo(() => {
    if (!cart) return false;
    return cart.items.some((item: any) => item.productType === 'tree');
  }, [cart]);

  // Actions
  const addTreeToCart = useCallback(
    async (product: TreeProduct) => {
      try {
        await addItemMutation({
          sessionId,
          productType: 'tree',
          productId: product.id,
          quantity: 1,
          unitPrice: product.price.amount,
        });
      } catch (error) {
        console.error('Failed to add tree to cart:', error);
        throw error;
      }
    },
    [sessionId, addItemMutation]
  );

  const addOrnamentToCart = useCallback(
    async (
      product: OrnamentProduct,
      color: string,
      position?: [number, number, number]
    ) => {
      try {
        await addItemMutation({
          sessionId,
          productType: 'ornament',
          productId: product.id,
          quantity: 1,
          unitPrice: product.price.amount,
          customization: { color, position },
        });
      } catch (error) {
        console.error('Failed to add ornament to cart:', error);
        throw error;
      }
    },
    [sessionId, addItemMutation]
  );

  const addTopperToCart = useCallback(
    async (product: TopperProduct, color: string) => {
      try {
        await addItemMutation({
          sessionId,
          productType: 'topper',
          productId: product.id,
          quantity: 1,
          unitPrice: product.price.amount,
          customization: { color },
        });
      } catch (error) {
        console.error('Failed to add topper to cart:', error);
        throw error;
      }
    },
    [sessionId, addItemMutation]
  );

  const removeFromCart = useCallback(
    async (itemId: string) => {
      try {
        await removeItemMutation({ sessionId, itemId });
      } catch (error) {
        console.error('Failed to remove item from cart:', error);
        throw error;
      }
    },
    [sessionId, removeItemMutation]
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      try {
        await updateQuantityMutation({ sessionId, itemId, quantity });
      } catch (error) {
        console.error('Failed to update quantity:', error);
        throw error;
      }
    },
    [sessionId, updateQuantityMutation]
  );

  const clearCart = useCallback(async () => {
    try {
      await clearMutation({ sessionId });
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    }
  }, [sessionId, clearMutation]);

  return {
    cart: cart || null,
    isLoading,
    itemCount,
    subtotal,
    formattedSubtotal,
    hasTree,
    addTreeToCart,
    addOrnamentToCart,
    addTopperToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };
}

export default useCartStore;