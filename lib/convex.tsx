/**
 * Convex-compatible React Hooks
 *
 * These hooks provide a Convex-like interface for the API layer.
 * When migrating to real Convex, replace with:
 *   import { useQuery, useMutation, useAction, ConvexProvider } from "convex/react";
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Re-export the api for convenience
export { api } from './api';

// ============================================
// PROVIDER
// ============================================

interface ConvexContextValue {
  isConnected: boolean;
}

const ConvexContext = createContext<ConvexContextValue | null>(null);

interface ConvexProviderProps {
  children: React.ReactNode;
}

export function ConvexProvider({ children }: ConvexProviderProps) {
  return (
    <ConvexContext.Provider value={{ isConnected: true }}>
      {children}
    </ConvexContext.Provider>
  );
}

export function useConvex() {
  const context = useContext(ConvexContext);
  if (!context) {
    throw new Error('useConvex must be used within a ConvexProvider');
  }
  return context;
}

// ============================================
// HOOKS
// ============================================

type AsyncFunction<Args, Result> = (args: Args) => Promise<Result>;

/**
 * Hook for queries (read operations with subscriptions)
 * Convex equivalent: useQuery(api.module.func, args)
 */
export function useQuery<Args, Result>(
  queryFn: AsyncFunction<Args, Result> & { subscribe?: (cb: () => void) => () => void },
  args: Args
): Result | undefined {
  const [data, setData] = useState<Result | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const result = await queryFn(args);
        if (mounted) setData(result);
      } catch (error) {
        console.error('Query error:', error);
      }
    };

    fetchData();

    const unsubscribe = queryFn.subscribe?.(() => fetchData());

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [queryFn]);

  return data;
}

/**
 * Hook for mutations (write operations)
 * Convex equivalent: useMutation(api.module.func)
 */
export function useMutation<Args, Result>(
  mutationFn: AsyncFunction<Args, Result>
): (args: Args) => Promise<Result> {
  return useCallback(
    async (args: Args): Promise<Result> => {
      try {
        return await mutationFn(args);
      } catch (error) {
        console.error('Mutation error:', error);
        throw error;
      }
    },
    [mutationFn]
  );
}

/**
 * Hook for actions (backend operations like AI calls)
 * Convex equivalent: useAction(api.module.func)
 */
export function useAction<Args, Result>(
  actionFn: AsyncFunction<Args, Result>
): (args: Args) => Promise<Result> {
  return useCallback(
    async (args: Args): Promise<Result> => {
      try {
        return await actionFn(args);
      } catch (error) {
        console.error('Action error:', error);
        throw error;
      }
    },
    [actionFn]
  );
}

/**
 * useAction with loading/error state
 */
export function useActionWithStatus<Args, Result>(
  actionFn: AsyncFunction<Args, Result>
): {
  runAction: (args: Args) => Promise<Result>;
  isLoading: boolean;
  error: Error | null;
} {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const runAction = useCallback(
    async (args: Args): Promise<Result> => {
      setIsLoading(true);
      setError(null);
      try {
        return await actionFn(args);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [actionFn]
  );

  return { runAction, isLoading, error };
}
