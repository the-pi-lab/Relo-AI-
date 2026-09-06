import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    
    return await ctx.db
      .query("products")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const search = query({
  args: { 
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    
    const results = await ctx.db
      .query("products")
      .withSearchIndex("search_products", (q) => 
        q.search("name", args.query).eq("userId", user._id)
      )
      .take(args.limit || 10);
    
    return results;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    currency: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    tags: v.array(v.string()),
    sku: v.optional(v.string()),
    inStock: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    
    return await ctx.db.insert("products", {
      userId: user._id,
      ...args,
    });
  },
});

export const bulkCreate = mutation({
  args: {
    products: v.array(v.object({
      name: v.string(),
      description: v.optional(v.string()),
      price: v.optional(v.number()),
      currency: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      tags: v.array(v.string()),
      sku: v.optional(v.string()),
      inStock: v.optional(v.boolean()),
    })),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    
    const ids = [];
    for (const product of args.products) {
      const id = await ctx.db.insert("products", {
        userId: user._id,
        ...product,
      });
      ids.push(id);
    }
    
    return ids;
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    currency: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    sku: v.optional(v.string()),
    inStock: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    
    const product = await ctx.db.get(args.id);
    if (!product || product.userId !== user._id) {
      throw new Error("Product not found");
    }
    
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    
    const product = await ctx.db.get(args.id);
    if (!product || product.userId !== user._id) {
      throw new Error("Product not found");
    }
    
    await ctx.db.delete(args.id);
  },
});
