import { useState, useEffect, useCallback, useMemo } from 'react';
import { Cart, CartItem, TreeProduct, OrnamentProduct, TopperProduct, formatPrice } from '../types';
import { getSessionId } from './sessionStore';
import * as cartApi from '../convex-dev/cart';

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
  refreshCart: () => Promise<void>;
}

export function useCartStore(): CartStore {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const sessionId = getSessionId();

  // Fetch cart on mount
  const refreshCart = useCallback(async () => {
    try {
      const data = await cartApi.get({ sessionId });
      setCart(data);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    refreshCart();

    // Subscribe to cart changes
    const unsubscribe = cartApi.subscribe(() => {
      refreshCart();
    });

    return unsubscribe;
  }, [refreshCart]);

  // Derived values
  const itemCount = useMemo(() => {
    if (!cart) return 0;
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const subtotal = cart?.subtotal || 0;
  const formattedSubtotal = formatPrice(subtotal);

  const hasTree = useMemo(() => {
    if (!cart) return false;
    return cart.items.some((item) => item.productType === 'tree');
  }, [cart]);

  // Actions
  const addTreeToCart = useCallback(
    async (product: TreeProduct) => {
      setIsLoading(true);
      try {
        const newCart = await cartApi.addItem({
          sessionId,
          productType: 'tree',
          productId: product.id,
          quantity: 1,
          unitPrice: product.price.amount,
        });
        setCart(newCart);
      } catch (error) {
        console.error('Failed to add tree to cart:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId]
  );

  const addOrnamentToCart = useCallback(
    async (
      product: OrnamentProduct,
      color: string,
      position?: [number, number, number]
    ) => {
      try {
        const newCart = await cartApi.addItem({
          sessionId,
          productType: 'ornament',
          productId: product.id,
          quantity: 1,
          unitPrice: product.price.amount,
          customization: { color, position },
        });
        setCart(newCart);
      } catch (error) {
        console.error('Failed to add ornament to cart:', error);
        throw error;
      }
    },
    [sessionId]
  );

  const addTopperToCart = useCallback(
    async (product: TopperProduct, color: string) => {
      try {
        const newCart = await cartApi.addItem({
          sessionId,
          productType: 'topper',
          productId: product.id,
          quantity: 1,
          unitPrice: product.price.amount,
          customization: { color },
        });
        setCart(newCart);
      } catch (error) {
        console.error('Failed to add topper to cart:', error);
        throw error;
      }
    },
    [sessionId]
  );

  const removeFromCart = useCallback(
    async (itemId: string) => {
      try {
        const newCart = await cartApi.removeItem({ sessionId, itemId });
        setCart(newCart);
      } catch (error) {
        console.error('Failed to remove item from cart:', error);
        throw error;
      }
    },
    [sessionId]
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      try {
        const newCart = await cartApi.updateQuantity({ sessionId, itemId, quantity });
        setCart(newCart);
      } catch (error) {
        console.error('Failed to update quantity:', error);
        throw error;
      }
    },
    [sessionId]
  );

  const clearCart = useCallback(async () => {
    try {
      await cartApi.clear({ sessionId });
      setCart(null);
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    }
  }, [sessionId]);

  return {
    cart,
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
    refreshCart,
  };
}

export default useCartStore;
