import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const save = mutation({
  args: {
    treeConfig: v.object({
      seed: v.number(),
      height: v.number(),
      radius: v.number(),
      tiers: v.number(),
      color: v.string(),
      snowAmount: v.number(),
    }),
    topper: v.union(
      v.object({
        type: v.string(),
        color: v.string(),
        scale: v.number(),
        glow: v.boolean(),
      }),
      v.null()
    ),
    ornaments: v.array(
      v.object({
        type: v.string(),
        color: v.string(),
        position: v.array(v.number()),
        scale: v.number(),
        rotation: v.optional(v.array(v.number())),
      })
    ),
    metadata: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      authorName: v.optional(v.string()),
      authorId: v.optional(v.string()),
      thumbnail: v.optional(v.string()),
      tags: v.array(v.string()),
    }),
    exportedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const treeId = await ctx.db.insert("trees", args);
    return treeId;
  },
});

export const get = query({
  args: { id: v.id("trees") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("trees")
      .order("desc")
      .take(args.limit ?? 10);
  },
});
