/**
 * Tree Store - Data abstraction layer
 *
 * This module provides a clean interface for tree decoration data.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, convex } from '../lib/convex';
import { api } from '../convex/_generated/api';
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
// STORE INTERFACE
// ============================================

export interface TreeStoreState {
  // Tree data
  ornaments: OrnamentData[];
  topper: TreeTopperData | null;
  treeConfig: TreeConfig;

  // User
  currentUser: User | null;

  // Loading states
  isLoading: boolean;
  isSyncing: boolean;
  cloudId?: string;
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
  getCloudShareURL: () => string;
  copyShareURL: () => Promise<boolean>;
  copyCloudShareURL: () => Promise<boolean>;
  downloadAsJSON: (filename?: string) => void;
  importFromCode: (code: string) => Promise<boolean>;
  importFromData: (data: TreeExportData) => Promise<void>;
  saveToStorage: (metadata?: Partial<TreeExportMetadata>) => Promise<string>;
  loadFromStorage: (id: string) => Promise<boolean>;
  saveToCloud: (metadata?: Partial<TreeExportMetadata>) => Promise<string>;
  loadFromCloud: (id: string) => Promise<boolean>;
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
  email: 'guest@example.com',
  passwordHash: '',
  name: 'Guest',
  tier: 'unlimited',
  quota: {
    ...DEFAULT_QUOTAS.unlimited,
    usedOrnaments: 0,
    usedToppers: 0,
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
} as any;

// ============================================
// STORE IMPLEMENTATION
// ============================================

export function useTreeStore(): TreeStore {
  // Local State (always available as a fallback/draft)
  const [ornaments, setOrnaments] = useState<OrnamentData[]>([]);
  const [topper, setTopperState] = useState<TreeTopperData | null>(null);
  const [treeConfig, setTreeConfig] = useState<TreeConfig>(DEFAULT_TREE_CONFIG);
  const [currentUser] = useState<User>(DEFAULT_USER);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing] = useState(false);
  const [cloudId, setCloudId] = useState<string | undefined>();

  // Convex Mutations
  const saveMutation = useMutation(api.trees.save);

  // Generate unique ID
  const generateId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Quota calculations
  const usedOrnaments = ornaments.length;

  const canAddOrnament = useCallback((): boolean => {
    if (!currentUser) return false;
    return usedOrnaments < (currentUser as any).quota.maxOrnaments;
  }, [currentUser, usedOrnaments]);

  const canUseOrnamentType = useCallback(
    (type: OrnamentType): boolean => {
      if (!currentUser) return false;
      const specialTypes: OrnamentType[] = ['heart', 'ribbon', 'gingerbread'];
      if (specialTypes.includes(type)) {
        return (currentUser as any).quota.canUseSpecialOrnaments;
      }
      return true;
    },
    [currentUser]
  );

  const getRemainingOrnaments = useCallback((): number => {
    if (!currentUser) return 0;
    return Math.max(0, (currentUser as any).quota.maxOrnaments - usedOrnaments);
  }, [currentUser, usedOrnaments]);

  // Actions
  const addOrnament = useCallback(
    async (ornamentData: Omit<OrnamentData, 'id' | 'userId' | 'createdAt'>): Promise<OrnamentData | null> => {
      if (!canAddOrnament()) return null;
      const newOrnament: OrnamentData = {
        ...ornamentData,
        id: generateId(),
        userId: currentUser?.id,
        userName: currentUser?.name,
        createdAt: Date.now(),
      };
      setOrnaments((prev) => [...prev, newOrnament]);
      return newOrnament;
    },
    [canAddOrnament, generateId, currentUser]
  );

  const removeOrnament = useCallback(async (ornamentId: string): Promise<boolean> => {
    setOrnaments((prev) => prev.filter((o) => o.id !== ornamentId));
    return true;
  }, []);

  const updateOrnament = useCallback(
    async (ornamentId: string, updates: Partial<OrnamentData>): Promise<boolean> => {
      setOrnaments((prev) => prev.map((o) => (o.id === ornamentId ? { ...o, ...updates } : o)));
      return true;
    },
    []
  );

  const clearOrnaments = useCallback(async (): Promise<void> => {
    setOrnaments([]);
  }, []);

  const setTopper = useCallback(
    async (topperData: Omit<TreeTopperData, 'id' | 'userId' | 'createdAt'> | null): Promise<void> => {
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
    },
    [generateId, currentUser]
  );

  const updateTreeConfig = useCallback((updates: Partial<TreeConfig>): void => {
    setTreeConfig((prev) => ({ ...prev, ...updates }));
  }, []);

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

  const importFromData = useCallback(
    async (data: TreeExportData): Promise<void> => {
      const restored = prepareTreeRestore(data);
      setOrnaments([]);
      setTopperState(null);
      setTreeConfig(restored.treeConfig);
      if (restored.topper) {
        setTopperState({
          ...restored.topper,
          id: generateId(),
          userId: currentUser?.id,
          userName: currentUser?.name,
          createdAt: Date.now(),
        });
      }
      setOrnaments(restored.ornaments.map((o) => ({
        ...o,
        id: generateId(),
        userId: currentUser?.id,
        userName: currentUser?.name,
        createdAt: Date.now(),
      })));
    },
    [generateId, currentUser]
  );

  const saveToCloud = useCallback(async (metadata?: Partial<TreeExportMetadata>): Promise<string> => {
    const data = exportTreeData(metadata);
    try {
      const id = await saveMutation({
        treeConfig: data.treeConfig,
        topper: data.topper,
        ornaments: data.ornaments.map(o => ({
          ...o,
          rotation: o.rotation as [number, number, number] | undefined
        })),
        metadata: data.metadata,
        exportedAt: data.exportedAt,
      });
      setCloudId(id);
      return id;
    } catch (error) {
      console.error("Failed to save to Convex:", error);
      // Fallback to local storage if Convex fails
      return await localStorageBackend.save(data);
    }
  }, [exportTreeData, saveMutation]);

  const loadFromCloud = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await convex.query(api.trees.get, { id: id as any });
      if (result) {
        await importFromData(result as any);
        setCloudId(id);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to load from cloud:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [importFromData]);

  const getCloudShareURL = useCallback((): string => {
    if (!cloudId) return '';
    return `${window.location.origin}?id=${cloudId}`;
  }, [cloudId]);

  const copyCloudShareURL = useCallback(async (): Promise<boolean> => {
    const url = getCloudShareURL();
    if (!url) return false;
    await navigator.clipboard.writeText(url);
    return true;
  }, [getCloudShareURL]);

  return useMemo(
    () => ({
      ornaments,
      topper,
      treeConfig,
      currentUser,
      isLoading,
      isSyncing,
      cloudId,
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
      getShareCode: () => generateShareCode(exportTreeData()),
      getShareURL: () => generateShareURL(exportTreeData()),
      getCloudShareURL,
      copyShareURL: async () => copyShareURLToClipboard(exportTreeData()),
      copyCloudShareURL,
      downloadAsJSON: (filename) => downloadTreeAsJSON(exportTreeData(), filename),
      importFromCode: async (code) => {
        const data = parseShareCode(code);
        if (!data) return false;
        await importFromData(data);
        return true;
      },
      importFromData,
      saveToStorage: async (meta) => localStorageBackend.save(exportTreeData(meta)),
      loadFromStorage: async (id) => {
        const data = await localStorageBackend.load(id);
        if (!data) return false;
        await importFromData(data);
        return true;
      },
      saveToCloud,
      loadFromCloud,
    }),
    [
      ornaments, topper, treeConfig, currentUser, isLoading, isSyncing, cloudId,
      addOrnament, removeOrnament, updateOrnament, clearOrnaments, setTopper,
      updateTreeConfig, canAddOrnament, canUseOrnamentType, getRemainingOrnaments,
      exportTreeData, importFromData, saveToCloud, loadFromCloud, getCloudShareURL,
      copyCloudShareURL
    ]
  );
}