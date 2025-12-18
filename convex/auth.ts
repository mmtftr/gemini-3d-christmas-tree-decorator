import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const signup = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existingUser) {
      return { success: false, error: "User already exists" };
    }

    // In a real app, hash the password
    const passwordHash = args.password; 

    const userId = await ctx.db.insert("users", {
      email: args.email,
      passwordHash,
      name: args.name,
      tier: "free",
      quota: {
        maxOrnaments: 10,
        usedOrnaments: 0,
        maxToppers: 1,
        usedToppers: 0,
        canUseSpecialOrnaments: false,
        canUseCustomColors: false,
        canUseAnimations: false,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const token = Math.random().toString(36).substring(2);
    await ctx.db.insert("sessions", {
      userId,
      token,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
    });

    const user = await ctx.db.get(userId);
    const { passwordHash: _, ...safeUser } = user!;

    return {
      success: true,
      token,
      user: safeUser,
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
      .unique();

    if (!user || user.passwordHash !== args.password) {
      return { success: false, error: "Invalid email or password" };
    }

    const token = Math.random().toString(36).substring(2);
    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30,
    });

    const { passwordHash: _, ...safeUser } = user;

    return {
      success: true,
      token,
      user: safeUser,
    };
  },
});

export const validateSession = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user) return null;

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  },
});

export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});

export const updateProfile = mutation({
  args: { token: v.string(), name: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!session || session.expiresAt < Date.now()) {
      return { success: false, error: "Invalid session" };
    }

    await ctx.db.patch(session.userId, {
      name: args.name,
      updatedAt: Date.now(),
    });

    const user = await ctx.db.get(session.userId);
    const { passwordHash: _, ...safeUser } = user!;

    return { success: true, user: safeUser };
  },
});

export const changePassword = mutation({
  args: {
    token: v.string(),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!session || session.expiresAt < Date.now()) {
      return { success: false, error: "Invalid session" };
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.passwordHash !== args.currentPassword) {
      return { success: false, error: "Invalid current password" };
    }

    await ctx.db.patch(user._id, {
      passwordHash: args.newPassword,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
