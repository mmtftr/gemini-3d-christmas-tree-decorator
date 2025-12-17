/**
 * Mock Convex API - Generated API object
 *
 * This mimics Convex's auto-generated api object.
 * When switching to real Convex, replace this with:
 * export { api } from "convex/_generated/api";
 */

import * as auth from '../auth';
import * as cart from '../cart';
import * as orders from '../orders';

export const api = {
  auth,
  cart,
  orders,
} as const;

export type Api = typeof api;
