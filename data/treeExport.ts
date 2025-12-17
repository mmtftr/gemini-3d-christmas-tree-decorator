/**
 * Tree Export/Import Utilities
 *
 * Provides functionality to save, share, and restore decorated trees.
 * Designed to be easily integrated with backend storage (Convex, etc.)
 *
 * Usage:
 *   // Export current tree
 *   const exportData = exportTree(ornaments, topper, treeConfig);
 *   const shareCode = generateShareCode(exportData);
 *
 *   // Import from share code
 *   const importData = parseShareCode(shareCode);
 *   if (importData) restoreTree(importData, store);
 */

import {
  OrnamentData,
  TreeTopperData,
  TreeConfig,
  OrnamentType,
  TopperType,
} from '../types';

// ============================================
// EXPORT DATA TYPES
// ============================================

export interface TreeExportData {
  version: number;
  exportedAt: number;
  metadata: TreeExportMetadata;
  treeConfig: TreeConfig;
  topper: TreeTopperExport | null;
  ornaments: OrnamentExport[];
}

export interface TreeExportMetadata {
  name?: string;
  description?: string;
  authorName?: string;
  authorId?: string;
  thumbnail?: string; // Base64 encoded thumbnail
  tags?: string[];
}

// Stripped-down ornament for export (no internal IDs)
export interface OrnamentExport {
  type: OrnamentType;
  color: string;
  position: [number, number, number];
  scale: number;
  rotation?: [number, number, number];
}

// Stripped-down topper for export
export interface TreeTopperExport {
  type: TopperType;
  color: string;
  scale: number;
  glow: boolean;
}

// ============================================
// EXPORT VERSION
// ============================================

const EXPORT_VERSION = 1;

// ============================================
// EXPORT FUNCTIONS
// ============================================

/**
 * Export the current tree state to a serializable format
 */
export function exportTree(
  ornaments: OrnamentData[],
  topper: TreeTopperData | null,
  treeConfig: TreeConfig,
  metadata?: Partial<TreeExportMetadata>
): TreeExportData {
  return {
    version: EXPORT_VERSION,
    exportedAt: Date.now(),
    metadata: {
      name: metadata?.name || 'My Christmas Tree',
      description: metadata?.description,
      authorName: metadata?.authorName,
      authorId: metadata?.authorId,
      thumbnail: metadata?.thumbnail,
      tags: metadata?.tags || [],
    },
    treeConfig: { ...treeConfig },
    topper: topper
      ? {
          type: topper.type,
          color: topper.color,
          scale: topper.scale,
          glow: topper.glow,
        }
      : null,
    ornaments: ornaments.map((o) => ({
      type: o.type,
      color: o.color,
      position: [...o.position] as [number, number, number],
      scale: o.scale,
      rotation: o.rotation ? ([...o.rotation] as [number, number, number]) : undefined,
    })),
  };
}

/**
 * Generate a compact share code from export data
 * Uses base64 encoding of compressed JSON
 */
export function generateShareCode(data: TreeExportData): string {
  try {
    const json = JSON.stringify(data);
    // Use base64 encoding (browser-safe)
    const encoded = btoa(unescape(encodeURIComponent(json)));
    return encoded;
  } catch (error) {
    console.error('Failed to generate share code:', error);
    throw new Error('Failed to generate share code');
  }
}

/**
 * Generate a shareable URL with the tree data
 */
export function generateShareURL(data: TreeExportData, baseUrl?: string): string {
  const code = generateShareCode(data);
  const base = baseUrl || window.location.origin;
  return `${base}?tree=${encodeURIComponent(code)}`;
}

/**
 * Export tree data as a downloadable JSON file
 */
export function downloadTreeAsJSON(data: TreeExportData, filename?: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `christmas-tree-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================
// IMPORT FUNCTIONS
// ============================================

/**
 * Parse a share code back into tree export data
 */
export function parseShareCode(code: string): TreeExportData | null {
  try {
    const json = decodeURIComponent(escape(atob(code)));
    const data = JSON.parse(json) as TreeExportData;

    // Validate the data
    if (!validateTreeExport(data)) {
      console.error('Invalid tree export data');
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to parse share code:', error);
    return null;
  }
}

/**
 * Parse a shareable URL to extract tree data
 */
export function parseShareURL(url: string): TreeExportData | null {
  try {
    const urlObj = new URL(url);
    const code = urlObj.searchParams.get('tree');
    if (!code) return null;
    return parseShareCode(decodeURIComponent(code));
  } catch (error) {
    console.error('Failed to parse share URL:', error);
    return null;
  }
}

/**
 * Import tree data from a JSON file
 */
export function importTreeFromFile(file: File): Promise<TreeExportData | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const data = JSON.parse(json) as TreeExportData;
        if (validateTreeExport(data)) {
          resolve(data);
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsText(file);
  });
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate tree export data structure
 */
export function validateTreeExport(data: unknown): data is TreeExportData {
  if (!data || typeof data !== 'object') return false;

  const d = data as Record<string, unknown>;

  // Check required fields
  if (typeof d.version !== 'number') return false;
  if (typeof d.exportedAt !== 'number') return false;
  if (!d.treeConfig || typeof d.treeConfig !== 'object') return false;
  if (!Array.isArray(d.ornaments)) return false;

  // Validate ornaments
  for (const ornament of d.ornaments as unknown[]) {
    if (!validateOrnamentExport(ornament)) return false;
  }

  // Validate topper if present
  if (d.topper !== null && !validateTopperExport(d.topper)) return false;

  return true;
}

function validateOrnamentExport(data: unknown): data is OrnamentExport {
  if (!data || typeof data !== 'object') return false;

  const o = data as Record<string, unknown>;

  if (typeof o.type !== 'string') return false;
  if (typeof o.color !== 'string') return false;
  if (!Array.isArray(o.position) || o.position.length !== 3) return false;
  if (typeof o.scale !== 'number') return false;

  return true;
}

function validateTopperExport(data: unknown): data is TreeTopperExport {
  if (!data || typeof data !== 'object') return false;

  const t = data as Record<string, unknown>;

  if (typeof t.type !== 'string') return false;
  if (typeof t.color !== 'string') return false;
  if (typeof t.scale !== 'number') return false;
  if (typeof t.glow !== 'boolean') return false;

  return true;
}

// ============================================
// RESTORE HELPERS
// ============================================

/**
 * Interface for the restore callback
 * This makes it easy for another agent to implement actual storage
 */
export interface TreeRestoreCallbacks {
  onRestoreStart?: () => void;
  onOrnamentAdded?: (ornament: OrnamentExport, index: number, total: number) => void;
  onTopperSet?: (topper: TreeTopperExport) => void;
  onConfigUpdated?: (config: TreeConfig) => void;
  onRestoreComplete?: (data: TreeExportData) => void;
  onRestoreError?: (error: Error) => void;
}

/**
 * Restore a tree from export data
 * Returns the data needed to rebuild the tree state
 */
export function prepareTreeRestore(data: TreeExportData): {
  treeConfig: TreeConfig;
  topper: TreeTopperExport | null;
  ornaments: OrnamentExport[];
  metadata: TreeExportMetadata;
} {
  return {
    treeConfig: data.treeConfig,
    topper: data.topper,
    ornaments: data.ornaments,
    metadata: data.metadata,
  };
}

// ============================================
// URL PARAMETER HANDLING
// ============================================

/**
 * Check if current URL has a shared tree
 */
export function hasSharedTreeInURL(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.has('tree');
}

/**
 * Get shared tree data from current URL
 */
export function getSharedTreeFromURL(): TreeExportData | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const code = params.get('tree');
  if (!code) return null;
  return parseShareCode(code);
}

/**
 * Clear the tree parameter from URL without reload
 */
export function clearTreeFromURL(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.delete('tree');
  window.history.replaceState({}, '', url.toString());
}

// ============================================
// CLIPBOARD HELPERS
// ============================================

/**
 * Copy share code to clipboard
 */
export async function copyShareCodeToClipboard(data: TreeExportData): Promise<boolean> {
  try {
    const code = generateShareCode(data);
    await navigator.clipboard.writeText(code);
    return true;
  } catch {
    return false;
  }
}

/**
 * Copy share URL to clipboard
 */
export async function copyShareURLToClipboard(data: TreeExportData): Promise<boolean> {
  try {
    const url = generateShareURL(data);
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read share code from clipboard
 */
export async function readShareCodeFromClipboard(): Promise<TreeExportData | null> {
  try {
    const text = await navigator.clipboard.readText();
    return parseShareCode(text);
  } catch {
    return null;
  }
}

// ============================================
// STORAGE INTERFACE (for backend integration)
// ============================================

/**
 * Interface for tree storage backends
 * Implement this interface to add persistence (Convex, localStorage, etc.)
 */
export interface TreeStorageBackend {
  // Save tree and return a unique ID
  save(data: TreeExportData): Promise<string>;

  // Load tree by ID
  load(id: string): Promise<TreeExportData | null>;

  // List saved trees (with pagination)
  list(options?: { limit?: number; offset?: number; userId?: string }): Promise<{
    trees: Array<{ id: string; metadata: TreeExportMetadata; savedAt: number }>;
    total: number;
  }>;

  // Delete a saved tree
  delete(id: string): Promise<boolean>;

  // Update metadata for a saved tree
  updateMetadata(id: string, metadata: Partial<TreeExportMetadata>): Promise<boolean>;
}

/**
 * Local storage implementation (for demo/development)
 */
export const localStorageBackend: TreeStorageBackend = {
  async save(data: TreeExportData): Promise<string> {
    const id = `tree-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const trees = JSON.parse(localStorage.getItem('savedTrees') || '{}');
    trees[id] = { data, savedAt: Date.now() };
    localStorage.setItem('savedTrees', JSON.stringify(trees));
    return id;
  },

  async load(id: string): Promise<TreeExportData | null> {
    const trees = JSON.parse(localStorage.getItem('savedTrees') || '{}');
    return trees[id]?.data || null;
  },

  async list(options?: { limit?: number; offset?: number }) {
    const trees = JSON.parse(localStorage.getItem('savedTrees') || '{}');
    const entries = Object.entries(trees).map(([id, value]) => ({
      id,
      metadata: (value as { data: TreeExportData; savedAt: number }).data.metadata,
      savedAt: (value as { data: TreeExportData; savedAt: number }).savedAt,
    }));

    const offset = options?.offset || 0;
    const limit = options?.limit || 10;

    return {
      trees: entries.slice(offset, offset + limit),
      total: entries.length,
    };
  },

  async delete(id: string): Promise<boolean> {
    const trees = JSON.parse(localStorage.getItem('savedTrees') || '{}');
    if (trees[id]) {
      delete trees[id];
      localStorage.setItem('savedTrees', JSON.stringify(trees));
      return true;
    }
    return false;
  },

  async updateMetadata(id: string, metadata: Partial<TreeExportMetadata>): Promise<boolean> {
    const trees = JSON.parse(localStorage.getItem('savedTrees') || '{}');
    if (trees[id]) {
      trees[id].data.metadata = { ...trees[id].data.metadata, ...metadata };
      localStorage.setItem('savedTrees', JSON.stringify(trees));
      return true;
    }
    return false;
  },
};

// ============================================
// THUMBNAIL GENERATION (placeholder)
// ============================================

/**
 * Generate a thumbnail from the canvas
 * Call this from the React component with access to the canvas
 */
export function generateThumbnailFromCanvas(
  canvas: HTMLCanvasElement,
  maxSize: number = 256
): string {
  const aspectRatio = canvas.width / canvas.height;
  let width = maxSize;
  let height = maxSize;

  if (aspectRatio > 1) {
    height = maxSize / aspectRatio;
  } else {
    width = maxSize * aspectRatio;
  }

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;

  const ctx = tempCanvas.getContext('2d');
  if (!ctx) return '';

  ctx.drawImage(canvas, 0, 0, width, height);
  return tempCanvas.toDataURL('image/jpeg', 0.7);
}
