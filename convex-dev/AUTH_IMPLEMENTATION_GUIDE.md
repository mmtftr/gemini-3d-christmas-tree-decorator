# Authentication Implementation Guide

This document provides instructions for implementing login/signup routes with custom backend logic using Convex.

## Current Setup

The scaffolding has been created with:

- **`convex-dev/auth.ts`** - Auth functions with TODO markers
- **`hooks/useAuth.ts`** - React hook for auth state management
- **`types.ts`** - Auth types (User, AuthSession, SignupData, LoginData, AuthResult)

## Files to Modify

### 1. `convex-dev/auth.ts` - Backend Logic

This file contains placeholder implementations that need to be replaced with real logic.

#### Priority TODOs:

1. **Password Hashing** (CRITICAL)
   ```typescript
   // Current (INSECURE placeholder):
   async function hashPassword(password: string): Promise<string> {
     return `hashed_${password}_${Date.now()}`;
   }

   // Replace with bcryptjs:
   import bcrypt from 'bcryptjs';
   async function hashPassword(password: string): Promise<string> {
     return await bcrypt.hash(password, 10);
   }
   ```

2. **Password Verification** (CRITICAL)
   ```typescript
   // Replace with:
   async function verifyPassword(password: string, hash: string): Promise<boolean> {
     return await bcrypt.compare(password, hash);
   }
   ```

3. **Token Generation** (RECOMMENDED)
   ```typescript
   // Current (basic):
   const generateToken = () => `token_${Date.now()}_${Math.random()...}`;

   // Option 1: Use crypto
   import { randomBytes } from 'crypto';
   const generateToken = () => randomBytes(32).toString('hex');

   // Option 2: Use JWT
   import jwt from 'jsonwebtoken';
   const generateToken = (userId: string) => jwt.sign({ userId }, SECRET_KEY, { expiresIn: '7d' });
   ```

4. **Password Reset** (if needed)
   - Implement `requestPasswordReset()` - send email with reset link
   - Implement `resetPassword()` - verify token and update password

### 2. Convex Migration

When migrating to real Convex, convert functions to use Convex decorators:

```typescript
// convex/auth.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const signup = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if email exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      throw new Error("Email already registered");
    }

    // Hash password
    const passwordHash = await hashPassword(args.password);

    // Create user
    const userId = await ctx.db.insert("users", {
      email: args.email,
      passwordHash,
      name: args.name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create session
    const token = generateToken();
    await ctx.db.insert("sessions", {
      userId,
      token,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      createdAt: Date.now(),
    });

    const user = await ctx.db.get(userId);
    return {
      success: true,
      token,
      user: { ...user, passwordHash: undefined },
    };
  },
});

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const valid = await verifyPassword(args.password, user.passwordHash);
    if (!valid) {
      throw new Error("Invalid credentials");
    }

    const token = generateToken();
    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      createdAt: Date.now(),
    });

    return {
      success: true,
      token,
      user: { ...user, passwordHash: undefined },
    };
  },
});

export const validateSession = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    return user ? { ...user, passwordHash: undefined } : null;
  },
});
```

### 3. Convex Schema

Create `convex/schema.ts`:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_email", ["email"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  // Optional: password reset tokens
  passwordResetTokens: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    used: v.boolean(),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),
});
```

## UI Components to Create

### Login Form Component

```tsx
// components/LoginForm.tsx
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function LoginForm() {
  const { login, error, isLoading, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login({ email, password });
    if (result.success) {
      // Redirect or close modal
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Log In'}
      </button>
    </form>
  );
}
```

### Signup Form Component

```tsx
// components/SignupForm.tsx
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function SignupForm() {
  const { signup, error, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signup({ email, password, name });
    if (result.success) {
      // Redirect or close modal
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name (optional)"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password (min 8 characters)"
        required
        minLength={8}
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating account...' : 'Sign Up'}
      </button>
    </form>
  );
}
```

### Auth Provider Setup

```tsx
// In App.tsx or main.tsx
import { AuthProvider } from '@/hooks/useAuth';

function App() {
  return (
    <AuthProvider>
      {/* Your app content */}
    </AuthProvider>
  );
}
```

## Security Checklist

- [ ] Replace placeholder password hashing with bcrypt
- [ ] Use secure token generation (crypto.randomBytes or JWT)
- [ ] Set appropriate session expiry (7 days recommended)
- [ ] Never expose passwordHash to client
- [ ] Implement rate limiting for login/signup endpoints
- [ ] Add CSRF protection if using cookies
- [ ] Use HTTPS in production
- [ ] Validate email format
- [ ] Enforce password strength requirements
- [ ] Implement account lockout after failed attempts (optional)
- [ ] Add email verification (optional)
- [ ] Implement password reset flow (optional)

## Dependencies to Install

```bash
# For password hashing
npm install bcryptjs
npm install -D @types/bcryptjs

# Optional: For JWT tokens
npm install jsonwebtoken
npm install -D @types/jsonwebtoken

# For Convex (when migrating)
npm install convex
```

## Testing

```typescript
// Test the auth flow
import { api } from './convex-dev';

// Test signup
const signupResult = await api.auth.signup({
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
});
console.log('Signup:', signupResult);

// Test login
const loginResult = await api.auth.login({
  email: 'test@example.com',
  password: 'password123',
});
console.log('Login:', loginResult);

// Test session validation
const user = await api.auth.validateSession({ token: loginResult.token! });
console.log('User:', user);

// Test logout
await api.auth.logout({ token: loginResult.token! });

// Reset for fresh testing
api.auth._reset();
```
