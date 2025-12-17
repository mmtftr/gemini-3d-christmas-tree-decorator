/**
 * Authentication Functions - SCAFFOLD FOR IMPLEMENTATION
 *
 * This file provides the structure for login/signup routes with custom backend logic.
 * Another agent should implement the TODO sections with actual authentication logic.
 *
 * IMPLEMENTATION GUIDE:
 * ====================
 *
 * 1. STORAGE OPTIONS (choose one):
 *    - localStorage (current pattern, client-side only)
 *    - Real Convex backend (recommended for production)
 *    - Custom API server
 *
 * 2. PASSWORD HANDLING:
 *    - Never store plain text passwords
 *    - Use bcrypt or similar for hashing
 *    - For Convex: use convex-helpers or implement server-side hashing
 *
 * 3. SESSION/TOKEN MANAGEMENT:
 *    - JWT tokens (stateless)
 *    - Session IDs with server-side storage
 *    - Convex: use ctx.auth for built-in auth or custom tokens
 *
 * 4. CONVEX MIGRATION:
 *    - Replace function signatures with Convex query/mutation decorators
 *    - Example: export const signup = mutation({ args: {...}, handler: async (ctx, args) => {...} })
 *    - Use ctx.db for database operations
 *    - Use v.string(), v.object() etc. for argument validation
 */

import { User, AuthSession, AuthResult, SignupData, LoginData } from '../types';

// ============================================
// STORAGE LAYER - TODO: Replace with real backend
// ============================================

const USERS_STORAGE_KEY = 'christmas_tree_users';
const SESSIONS_STORAGE_KEY = 'christmas_tree_sessions';

// In-memory stores (mimics Convex tables)
const usersStore: Map<string, User> = new Map();
const sessionsStore: Map<string, AuthSession> = new Map();
let authListeners: Set<() => void> = new Set();

// TODO: Replace with Convex schema definition:
// ```
// // In convex/schema.ts
// import { defineSchema, defineTable } from "convex/server";
// import { v } from "convex/values";
//
// export default defineSchema({
//   users: defineTable({
//     email: v.string(),
//     passwordHash: v.string(),
//     name: v.optional(v.string()),
//     createdAt: v.number(),
//     updatedAt: v.number(),
//   }).index("by_email", ["email"]),
//
//   sessions: defineTable({
//     userId: v.id("users"),
//     token: v.string(),
//     expiresAt: v.number(),
//     createdAt: v.number(),
//   }).index("by_token", ["token"])
//     .index("by_user", ["userId"]),
// });
// ```

// Load from localStorage on init
const loadFromStorage = () => {
  try {
    if (typeof window === 'undefined') return;

    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (storedUsers) {
      const data = JSON.parse(storedUsers) as Record<string, User>;
      Object.entries(data).forEach(([key, user]) => usersStore.set(key, user));
    }

    const storedSessions = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (storedSessions) {
      const data = JSON.parse(storedSessions) as Record<string, AuthSession>;
      Object.entries(data).forEach(([key, session]) => sessionsStore.set(key, session));
    }
  } catch (e) {
    console.error('Failed to load auth from storage:', e);
  }
};

const saveToStorage = () => {
  try {
    if (typeof window === 'undefined') return;

    const usersData: Record<string, User> = {};
    usersStore.forEach((user, key) => (usersData[key] = user));
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersData));

    const sessionsData: Record<string, AuthSession> = {};
    sessionsStore.forEach((session, key) => (sessionsData[key] = session));
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessionsData));
  } catch (e) {
    console.error('Failed to save auth to storage:', e);
  }
};

loadFromStorage();

const notifyListeners = () => {
  saveToStorage();
  authListeners.forEach((l) => l());
};

const generateId = () => `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
const generateToken = () => `token_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

// ============================================
// HELPER FUNCTIONS - TODO: Implement properly
// ============================================

/**
 * Hash password
 * TODO: Implement with bcrypt or similar
 *
 * For Convex, you might use:
 * - bcryptjs (pure JS, works in Convex)
 * - Or use Convex Auth (built-in solution)
 *
 * Example with bcryptjs:
 * ```
 * import bcrypt from 'bcryptjs';
 * const hashPassword = async (password: string) => {
 *   return await bcrypt.hash(password, 10);
 * };
 * ```
 */
async function hashPassword(password: string): Promise<string> {
  // TODO: IMPLEMENT - This is NOT secure, just a placeholder
  // WARNING: Never use this in production!
  return `hashed_${password}_${Date.now()}`;
}

/**
 * Verify password against hash
 * TODO: Implement with bcrypt or similar
 *
 * Example with bcryptjs:
 * ```
 * const verifyPassword = async (password: string, hash: string) => {
 *   return await bcrypt.compare(password, hash);
 * };
 * ```
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // TODO: IMPLEMENT - This is NOT secure, just a placeholder
  // WARNING: Never use this in production!
  return hash.startsWith(`hashed_${password}_`);
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * TODO: Customize password requirements
 */
function isValidPassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  // TODO: Add more validation rules as needed
  // - Require uppercase
  // - Require numbers
  // - Require special characters
  return { valid: true };
}

// ============================================
// AUTH FUNCTIONS - Main API
// ============================================

/**
 * Sign up a new user
 *
 * Convex migration:
 * ```
 * export const signup = mutation({
 *   args: {
 *     email: v.string(),
 *     password: v.string(),
 *     name: v.optional(v.string()),
 *   },
 *   handler: async (ctx, args) => {
 *     // Check if email exists
 *     const existing = await ctx.db
 *       .query("users")
 *       .withIndex("by_email", (q) => q.eq("email", args.email))
 *       .first();
 *     if (existing) throw new Error("Email already registered");
 *
 *     // Hash password and create user
 *     const passwordHash = await hashPassword(args.password);
 *     const userId = await ctx.db.insert("users", {
 *       email: args.email,
 *       passwordHash,
 *       name: args.name,
 *       createdAt: Date.now(),
 *       updatedAt: Date.now(),
 *     });
 *
 *     // Create session
 *     const token = generateToken();
 *     await ctx.db.insert("sessions", {
 *       userId,
 *       token,
 *       expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
 *       createdAt: Date.now(),
 *     });
 *
 *     return { success: true, token, user: {...} };
 *   },
 * });
 * ```
 */
export async function signup(args: SignupData): Promise<AuthResult> {
  const { email, password, name } = args;

  // Validate email
  if (!isValidEmail(email)) {
    return { success: false, error: 'Invalid email format' };
  }

  // Validate password
  const passwordValidation = isValidPassword(password);
  if (!passwordValidation.valid) {
    return { success: false, error: passwordValidation.error };
  }

  // Check if email already exists
  // TODO: For Convex, use: ctx.db.query("users").withIndex("by_email", ...)
  const existingUser = Array.from(usersStore.values()).find(u => u.email === email);
  if (existingUser) {
    return { success: false, error: 'Email already registered' };
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const userId = generateId();
  const now = Date.now();
  const user: User = {
    id: userId,
    email,
    passwordHash,
    name,
    createdAt: now,
    updatedAt: now,
  };

  usersStore.set(userId, user);

  // Create session
  const token = generateToken();
  const session: AuthSession = {
    id: `session_${Date.now()}`,
    userId,
    token,
    expiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days
    createdAt: now,
  };

  sessionsStore.set(token, session);
  notifyListeners();

  // Return sanitized user (no password hash)
  const { passwordHash: _, ...safeUser } = user;
  return {
    success: true,
    token,
    user: safeUser as Omit<User, 'passwordHash'>,
  };
}

/**
 * Log in an existing user
 *
 * Convex migration:
 * ```
 * export const login = mutation({
 *   args: {
 *     email: v.string(),
 *     password: v.string(),
 *   },
 *   handler: async (ctx, args) => {
 *     const user = await ctx.db
 *       .query("users")
 *       .withIndex("by_email", (q) => q.eq("email", args.email))
 *       .first();
 *     if (!user) throw new Error("Invalid credentials");
 *
 *     const valid = await verifyPassword(args.password, user.passwordHash);
 *     if (!valid) throw new Error("Invalid credentials");
 *
 *     // Create new session
 *     const token = generateToken();
 *     await ctx.db.insert("sessions", {...});
 *
 *     return { success: true, token, user: {...} };
 *   },
 * });
 * ```
 */
export async function login(args: LoginData): Promise<AuthResult> {
  const { email, password } = args;

  // Find user by email
  // TODO: For Convex, use: ctx.db.query("users").withIndex("by_email", ...)
  const user = Array.from(usersStore.values()).find(u => u.email === email);
  if (!user) {
    return { success: false, error: 'Invalid email or password' };
  }

  // Verify password
  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) {
    return { success: false, error: 'Invalid email or password' };
  }

  // Create new session
  const token = generateToken();
  const session: AuthSession = {
    id: `session_${Date.now()}`,
    userId: user.id,
    token,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    createdAt: Date.now(),
  };

  sessionsStore.set(token, session);
  notifyListeners();

  // Return sanitized user (no password hash)
  const { passwordHash: _, ...safeUser } = user;
  return {
    success: true,
    token,
    user: safeUser as Omit<User, 'passwordHash'>,
  };
}

/**
 * Log out - invalidate session
 *
 * Convex migration:
 * ```
 * export const logout = mutation({
 *   args: { token: v.string() },
 *   handler: async (ctx, args) => {
 *     const session = await ctx.db
 *       .query("sessions")
 *       .withIndex("by_token", (q) => q.eq("token", args.token))
 *       .first();
 *     if (session) {
 *       await ctx.db.delete(session._id);
 *     }
 *   },
 * });
 * ```
 */
export async function logout(args: { token: string }): Promise<void> {
  sessionsStore.delete(args.token);
  notifyListeners();
}

/**
 * Validate session token and get user
 *
 * Convex migration:
 * ```
 * export const validateSession = query({
 *   args: { token: v.string() },
 *   handler: async (ctx, args) => {
 *     const session = await ctx.db
 *       .query("sessions")
 *       .withIndex("by_token", (q) => q.eq("token", args.token))
 *       .first();
 *
 *     if (!session || session.expiresAt < Date.now()) {
 *       return null;
 *     }
 *
 *     const user = await ctx.db.get(session.userId);
 *     return user ? { ...user, passwordHash: undefined } : null;
 *   },
 * });
 * ```
 */
export async function validateSession(args: { token: string }): Promise<Omit<User, 'passwordHash'> | null> {
  const session = sessionsStore.get(args.token);

  if (!session) {
    return null;
  }

  // Check if session expired
  if (session.expiresAt < Date.now()) {
    sessionsStore.delete(args.token);
    notifyListeners();
    return null;
  }

  // Get user
  const user = usersStore.get(session.userId);
  if (!user) {
    return null;
  }

  // Return sanitized user
  const { passwordHash: _, ...safeUser } = user;
  return safeUser as Omit<User, 'passwordHash'>;
}

/**
 * Get current user from token
 * Alias for validateSession for convenience
 */
export async function getCurrentUser(args: { token: string }): Promise<Omit<User, 'passwordHash'> | null> {
  return validateSession(args);
}

/**
 * Update user profile
 *
 * Convex migration:
 * ```
 * export const updateProfile = mutation({
 *   args: {
 *     token: v.string(),
 *     name: v.optional(v.string()),
 *     // Add other updatable fields
 *   },
 *   handler: async (ctx, args) => {
 *     const user = await validateSession({ token: args.token });
 *     if (!user) throw new Error("Not authenticated");
 *
 *     await ctx.db.patch(user._id, {
 *       name: args.name,
 *       updatedAt: Date.now(),
 *     });
 *   },
 * });
 * ```
 */
export async function updateProfile(args: {
  token: string;
  name?: string;
}): Promise<AuthResult> {
  const session = sessionsStore.get(args.token);
  if (!session || session.expiresAt < Date.now()) {
    return { success: false, error: 'Not authenticated' };
  }

  const user = usersStore.get(session.userId);
  if (!user) {
    return { success: false, error: 'User not found' };
  }

  // Update user
  if (args.name !== undefined) {
    user.name = args.name;
  }
  user.updatedAt = Date.now();

  usersStore.set(user.id, user);
  notifyListeners();

  const { passwordHash: _, ...safeUser } = user;
  return {
    success: true,
    user: safeUser as Omit<User, 'passwordHash'>,
  };
}

/**
 * Change password
 *
 * TODO: Implement with proper password verification
 */
export async function changePassword(args: {
  token: string;
  currentPassword: string;
  newPassword: string;
}): Promise<AuthResult> {
  const session = sessionsStore.get(args.token);
  if (!session || session.expiresAt < Date.now()) {
    return { success: false, error: 'Not authenticated' };
  }

  const user = usersStore.get(session.userId);
  if (!user) {
    return { success: false, error: 'User not found' };
  }

  // Verify current password
  const validPassword = await verifyPassword(args.currentPassword, user.passwordHash);
  if (!validPassword) {
    return { success: false, error: 'Current password is incorrect' };
  }

  // Validate new password
  const passwordValidation = isValidPassword(args.newPassword);
  if (!passwordValidation.valid) {
    return { success: false, error: passwordValidation.error };
  }

  // Update password
  user.passwordHash = await hashPassword(args.newPassword);
  user.updatedAt = Date.now();

  usersStore.set(user.id, user);
  notifyListeners();

  return { success: true };
}

/**
 * Request password reset
 *
 * TODO: Implement email sending
 * TODO: Create password reset tokens table
 */
export async function requestPasswordReset(args: { email: string }): Promise<{ success: boolean; error?: string }> {
  // TODO: IMPLEMENT
  // 1. Find user by email
  // 2. Generate reset token
  // 3. Store reset token with expiry
  // 4. Send email with reset link

  console.warn('requestPasswordReset not implemented');
  return { success: true }; // Always return success to prevent email enumeration
}

/**
 * Reset password with token
 *
 * TODO: Implement token verification
 */
export async function resetPassword(args: {
  resetToken: string;
  newPassword: string;
}): Promise<AuthResult> {
  // TODO: IMPLEMENT
  // 1. Verify reset token is valid and not expired
  // 2. Get user from token
  // 3. Update password
  // 4. Delete reset token
  // 5. Optionally invalidate all existing sessions

  console.warn('resetPassword not implemented');
  return { success: false, error: 'Not implemented' };
}

// ============================================
// SUBSCRIPTION & UTILITIES
// ============================================

/**
 * Subscribe to auth state changes
 */
export function subscribe(callback: () => void): () => void {
  authListeners.add(callback);
  return () => authListeners.delete(callback);
}

/**
 * Reset auth store (for testing)
 */
export function _reset(): void {
  usersStore.clear();
  sessionsStore.clear();
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USERS_STORAGE_KEY);
    localStorage.removeItem(SESSIONS_STORAGE_KEY);
  }
  notifyListeners();
}

/**
 * Get all users (admin only - for testing)
 * TODO: Add proper admin authorization
 */
export async function _getAllUsers(): Promise<Array<Omit<User, 'passwordHash'>>> {
  return Array.from(usersStore.values()).map(({ passwordHash: _, ...user }) => user);
}
