/**
 * Convex API Entry Point
 *
 * This barrel file exports all Convex-style functions.
 * When migrating to real Convex, this file can be removed
 * as Convex auto-generates the api object.
 */

export { api } from './_generated/api';

// Re-export individual modules for direct access if needed
export * as auth from './auth';
export * as cart from './cart';
export * as orders from './orders';
