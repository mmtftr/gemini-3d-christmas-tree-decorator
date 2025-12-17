/**
 * Tree Store - Data abstraction layer
 *
 * This module provides a clean interface for tree decoration data.
 * Currently uses local React state, but designed to be easily replaced
 * with Convex queries/mutations when backend is added.
 *
 * To integrate Convex:
 * 1. Replace useLocalTreeStore with a hook that uses Convex queries
 * 2. Replace action functions with Convex mutations
 * 3. Add real-time subscriptions for multi-user sync
 */

import { useState, useCallback, useMemo } from 'react';
import {
  OrnamentData,
  TreeTopperData,
  TreeConfig,
  User,
  UserQuota,
  DEFAULT_QUOTAS,
  OrnamentType,
  TopperType,
} from '../types';
import {
  TreeExportData,
  TreeExportMetadata,
  exportTree,
  prepareTreeRestore,
  generateShareCode,
  generateShareURL,
  parseShareCode,
  downloadTreeAsJSON,
  copyShareURLToClipboard,
  localStorageBackend,
} from './treeExport';

// ============================================
// STORE INTERFACE (matches future Convex API)
// ============================================

export interface TreeStoreState {
  // Tree data
  ornaments: OrnamentData[];
  topper: TreeTopperData | null;
  treeConfig: TreeConfig;

  // User (will come from Convex auth)
  currentUser: User | null;

  // Loading states
  isLoading: boolean;
  isSyncing: boolean;
}

export interface TreeStoreActions {
  // Ornament mutations
  addOrnament: (ornament: Omit<OrnamentData, 'id' | 'userId' | 'createdAt'>) => Promise<OrnamentData | null>;
  removeOrnament: (ornamentId: string) => Promise<boolean>;
  updateOrnament: (ornamentId: string, updates: Partial<OrnamentData>) => Promise<boolean>;
  clearOrnaments: () => Promise<void>;

  // Topper mutations
  setTopper: (topper: Omit<TreeTopperData, 'id' | 'userId' | 'createdAt'> | null) => Promise<void>;

  // Tree config mutations
  updateTreeConfig: (updates: Partial<TreeConfig>) => void;

  // Quota helpers
  canAddOrnament: () => boolean;
  canUseOrnamentType: (type: OrnamentType) => boolean;
  getRemainingOrnaments: () => number;

  // Export/Import actions
  exportTreeData: (metadata?: Partial<TreeExportMetadata>) => TreeExportData;
  getShareCode: () => string;
  getShareURL: () => string;
  copyShareURL: () => Promise<boolean>;
  downloadAsJSON: (filename?: string) => void;
  importFromCode: (code: string) => Promise<boolean>;
  importFromData: (data: TreeExportData) => Promise<void>;
  saveToStorage: (metadata?: Partial<TreeExportMetadata>) => Promise<string>;
  loadFromStorage: (id: string) => Promise<boolean>;
}

export type TreeStore = TreeStoreState & TreeStoreActions;

// ============================================
// DEFAULT VALUES
// ============================================

const DEFAULT_TREE_CONFIG: TreeConfig = {
  seed: 12345,
  height: 6,
  radius: 2.5,
  tiers: 7,
  color: '#1a472a',
  snowAmount: 0.3,
};

const DEFAULT_USER: User = {
  id: 'local-user',
  name: 'Guest',
  tier: 'unlimited', // For local dev, unlimited access
  quota: {
    ...DEFAULT_QUOTAS.unlimited,
    usedOrnaments: 0,
    usedToppers: 0,
  },
};

// ============================================
// LOCAL STORE IMPLEMENTATION
// ============================================

/**
 * Local React state implementation of the tree store.
 * Replace this with Convex hooks when backend is ready.
 */
export function useLocalTreeStore(): TreeStore {
  // State
  const [ornaments, setOrnaments] = useState<OrnamentData[]>([]);
  const [topper, setTopperState] = useState<TreeTopperData | null>(null);
  const [treeConfig, setTreeConfig] = useState<TreeConfig>(DEFAULT_TREE_CONFIG);
  const [currentUser] = useState<User>(DEFAULT_USER);
  const [isLoading] = useState(false);
  const [isSyncing] = useState(false);

  // Generate unique ID (will be replaced by Convex ID generation)
  const generateId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Quota calculations
  const usedOrnaments = ornaments.length;
  const usedToppers = topper ? 1 : 0;

  const canAddOrnament = useCallback((): boolean => {
    if (!currentUser) return false;
    return usedOrnaments < currentUser.quota.maxOrnaments;
  }, [currentUser, usedOrnaments]);

  const canUseOrnamentType = useCallback(
    (type: OrnamentType): boolean => {
      if (!currentUser) return false;

      // Special ornaments require permission
      const specialTypes: OrnamentType[] = ['heart', 'ribbon', 'gingerbread'];
      if (specialTypes.includes(type)) {
        return currentUser.quota.canUseSpecialOrnaments;
      }

      return true;
    },
    [currentUser]
  );

  const getRemainingOrnaments = useCallback((): number => {
    if (!currentUser) return 0;
    return Math.max(0, currentUser.quota.maxOrnaments - usedOrnaments);
  }, [currentUser, usedOrnaments]);

  // Ornament mutations
  const addOrnament = useCallback(
    async (
      ornamentData: Omit<OrnamentData, 'id' | 'userId' | 'createdAt'>
    ): Promise<OrnamentData | null> => {
      if (!canAddOrnament()) {
        console.warn('Quota exceeded: Cannot add more ornaments');
        return null;
      }

      if (!canUseOrnamentType(ornamentData.type)) {
        console.warn(`Premium required: Cannot use ornament type "${ornamentData.type}"`);
        return null;
      }

      const newOrnament: OrnamentData = {
        ...ornamentData,
        id: generateId(),
        userId: currentUser?.id,
        userName: currentUser?.name,
        createdAt: Date.now(),
      };

      setOrnaments((prev) => [...prev, newOrnament]);

      // In Convex: await ctx.runMutation(api.ornaments.add, newOrnament)
      return newOrnament;
    },
    [canAddOrnament, canUseOrnamentType, generateId, currentUser]
  );

  const removeOrnament = useCallback(async (ornamentId: string): Promise<boolean> => {
    setOrnaments((prev) => prev.filter((o) => o.id !== ornamentId));
    // In Convex: await ctx.runMutation(api.ornaments.remove, { id: ornamentId })
    return true;
  }, []);

  const updateOrnament = useCallback(
    async (ornamentId: string, updates: Partial<OrnamentData>): Promise<boolean> => {
      setOrnaments((prev) =>
        prev.map((o) => (o.id === ornamentId ? { ...o, ...updates } : o))
      );
      // In Convex: await ctx.runMutation(api.ornaments.update, { id: ornamentId, ...updates })
      return true;
    },
    []
  );

  const clearOrnaments = useCallback(async (): Promise<void> => {
    setOrnaments([]);
    // In Convex: await ctx.runMutation(api.ornaments.clearAll, { sessionId })
  }, []);

  // Topper mutations
  const setTopper = useCallback(
    async (
      topperData: Omit<TreeTopperData, 'id' | 'userId' | 'createdAt'> | null
    ): Promise<void> => {
      if (topperData === null) {
        setTopperState(null);
        return;
      }

      const newTopper: TreeTopperData = {
        ...topperData,
        id: generateId(),
        userId: currentUser?.id,
        userName: currentUser?.name,
        createdAt: Date.now(),
      };

      setTopperState(newTopper);
      // In Convex: await ctx.runMutation(api.topper.set, newTopper)
    },
    [generateId, currentUser]
  );

  // Tree config mutations
  const updateTreeConfig = useCallback((updates: Partial<TreeConfig>): void => {
    setTreeConfig((prev) => ({ ...prev, ...updates }));
    // In Convex: await ctx.runMutation(api.session.updateConfig, updates)
  }, []);

  // Export/Import actions
  const exportTreeData = useCallback(
    (metadata?: Partial<TreeExportMetadata>): TreeExportData => {
      return exportTree(ornaments, topper, treeConfig, {
        ...metadata,
        authorName: currentUser?.name,
        authorId: currentUser?.id,
      });
    },
    [ornaments, topper, treeConfig, currentUser]
  );

  const getShareCode = useCallback((): string => {
    const data = exportTreeData();
    return generateShareCode(data);
  }, [exportTreeData]);

  const getShareURL = useCallback((): string => {
    const data = exportTreeData();
    return generateShareURL(data);
  }, [exportTreeData]);

  const copyShareURL = useCallback(async (): Promise<boolean> => {
    const data = exportTreeData();
    return copyShareURLToClipboard(data);
  }, [exportTreeData]);

  const downloadAsJSON = useCallback(
    (filename?: string): void => {
      const data = exportTreeData();
      downloadTreeAsJSON(data, filename);
    },
    [exportTreeData]
  );

  const importFromData = useCallback(
    async (data: TreeExportData): Promise<void> => {
      const restored = prepareTreeRestore(data);

      // Clear existing decorations
      setOrnaments([]);
      setTopperState(null);

      // Restore tree config
      setTreeConfig(restored.treeConfig);

      // Restore topper
      if (restored.topper) {
        const newTopper: TreeTopperData = {
          ...restored.topper,
          id: generateId(),
          userId: currentUser?.id,
          userName: currentUser?.name,
          createdAt: Date.now(),
        };
        setTopperState(newTopper);
      }

      // Restore ornaments
      const newOrnaments: OrnamentData[] = restored.ornaments.map((o) => ({
        ...o,
        id: generateId(),
        userId: currentUser?.id,
        userName: currentUser?.name,
        createdAt: Date.now(),
      }));
      setOrnaments(newOrnaments);
    },
    [generateId, currentUser]
  );

  const importFromCode = useCallback(
    async (code: string): Promise<boolean> => {
      const data = parseShareCode(code);
      if (!data) return false;
      await importFromData(data);
      return true;
    },
    [importFromData]
  );

  const saveToStorage = useCallback(
    async (metadata?: Partial<TreeExportMetadata>): Promise<string> => {
      const data = exportTreeData(metadata);
      return localStorageBackend.save(data);
    },
    [exportTreeData]
  );

  const loadFromStorage = useCallback(
    async (id: string): Promise<boolean> => {
      const data = await localStorageBackend.load(id);
      if (!data) return false;
      await importFromData(data);
      return true;
    },
    [importFromData]
  );

  // Return store object
  return useMemo(
    () => ({
      // State
      ornaments,
      topper,
      treeConfig,
      currentUser,
      isLoading,
      isSyncing,

      // Actions
      addOrnament,
      removeOrnament,
      updateOrnament,
      clearOrnaments,
      setTopper,
      updateTreeConfig,

      // Helpers
      canAddOrnament,
      canUseOrnamentType,
      getRemainingOrnaments,

      // Export/Import
      exportTreeData,
      getShareCode,
      getShareURL,
      copyShareURL,
      downloadAsJSON,
      importFromCode,
      importFromData,
      saveToStorage,
      loadFromStorage,
    }),
    [
      ornaments,
      topper,
      treeConfig,
      currentUser,
      isLoading,
      isSyncing,
      addOrnament,
      removeOrnament,
      updateOrnament,
      clearOrnaments,
      setTopper,
      updateTreeConfig,
      canAddOrnament,
      canUseOrnamentType,
      getRemainingOrnaments,
      exportTreeData,
      getShareCode,
      getShareURL,
      copyShareURL,
      downloadAsJSON,
      importFromCode,
      importFromData,
      saveToStorage,
      loadFromStorage,
    ]
  );
}

// ============================================
// CONVEX STORE PLACEHOLDER
// ============================================

/**
 * Convex implementation placeholder.
 * Uncomment and implement when Convex backend is ready.
 *
 * import { useQuery, useMutation } from 'convex/react';
 * import { api } from '../convex-dev/_generated/api';
 *
 * export function useConvexTreeStore(sessionId: string): TreeStore {
 *   const ornaments = useQuery(api.ornaments.list, { sessionId }) ?? [];
 *   const topper = useQuery(api.topper.get, { sessionId });
 *   const session = useQuery(api.session.get, { sessionId });
 *   const currentUser = useQuery(api.users.me);
 *
 *   const addOrnamentMutation = useMutation(api.ornaments.add);
 *   const removeOrnamentMutation = useMutation(api.ornaments.remove);
 *   // ... etc
 *
 *   return {
 *     ornaments,
 *     topper,
 *     treeConfig: session?.treeConfig ?? DEFAULT_TREE_CONFIG,
 *     currentUser,
 *     isLoading: ornaments === undefined,
 *     isSyncing: false,
 *     addOrnament: async (data) => addOrnamentMutation({ sessionId, ...data }),
 *     // ... etc
 *   };
 * }
 */

// ============================================
// STORE PROVIDER HOOK
// ============================================

/**
 * Main hook to use in components.
 * Switch between local and Convex by changing the implementation here.
 */
export function useTreeStore(): TreeStore {
  // For now, use local store
  // When Convex is ready: return useConvexTreeStore(sessionId);
  return useLocalTreeStore();
}
