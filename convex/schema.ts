import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  trees: defineTable({
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
  }),
  carts: defineTable({
    sessionId: v.string(),
    items: v.array(
      v.object({
        id: v.string(),
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
      })
    ),
    subtotal: v.number(),
    updatedAt: v.number(),
  }).index("by_sessionId", ["sessionId"]),
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    tier: v.string(),
    quota: v.object({
      maxOrnaments: v.number(),
      usedOrnaments: v.number(),
      maxToppers: v.number(),
      usedToppers: v.number(),
      canUseSpecialOrnaments: v.boolean(),
      canUseCustomColors: v.boolean(),
      canUseAnimations: v.boolean(),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"]),
  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  }).index("by_token", ["token"]),
});
