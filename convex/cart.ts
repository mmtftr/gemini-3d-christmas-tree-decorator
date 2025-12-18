import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("carts")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .unique();
  },
});

export const addItem = mutation({
  args: {
    sessionId: v.string(),
    productType: v.string(),
    productId: v.string(),
    quantity: v.number(),
    unitPrice: v.number(),
    customization: v.optional(
      v.object({
        color: v.string(),
        position: v.optional(v.array(v.number())),
        rotation: v.optional(v.array(v.number())),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { sessionId, ...itemData } = args;
    let cart = await ctx.db
      .query("carts")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .unique();

    const newItem = {
      id: Math.random().toString(36).substring(2, 9),
      ...itemData,
    };

    if (!cart) {
      const cartId = await ctx.db.insert("carts", {
        sessionId,
        items: [newItem],
        subtotal: newItem.unitPrice * newItem.quantity,
        updatedAt: Date.now(),
      });
      return await ctx.db.get(cartId);
    } else {
      const items = [...cart.items, newItem];
      const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      await ctx.db.patch(cart._id, {
        items,
        subtotal,
        updatedAt: Date.now(),
      });
      return await ctx.db.get(cart._id);
    }
  },
});

export const removeItem = mutation({
  args: { sessionId: v.string(), itemId: v.string() },
  handler: async (ctx, args) => {
    let cart = await ctx.db
      .query("carts")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    if (!cart) return null;

    const items = cart.items.filter((item: any) => item.id !== args.itemId);
    const subtotal = items.reduce((sum: number, item: any) => sum + item.unitPrice * item.quantity, 0);

    await ctx.db.patch(cart._id, {
      items,
      subtotal,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(cart._id);
  },
});

export const updateQuantity = mutation({
  args: { sessionId: v.string(), itemId: v.string(), quantity: v.number() },
  handler: async (ctx, args) => {
    let cart = await ctx.db
      .query("carts")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    if (!cart) return null;

    const items = cart.items.map((item: any) =>
      item.id === args.itemId ? { ...item, quantity: args.quantity } : item
    );
    const subtotal = items.reduce((sum: number, item: any) => sum + item.unitPrice * item.quantity, 0);

    await ctx.db.patch(cart._id, {
      items,
      subtotal,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(cart._id);
  },
});

export const clear = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    let cart = await ctx.db
      .query("carts")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    if (cart) {
      await ctx.db.delete(cart._id);
    }
    return null;
  },
});
