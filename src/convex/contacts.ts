import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";
import { integrationTypeValidator } from "./schema";

export const list = query({
  args: {
    platform: v.optional(integrationTypeValidator),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    
    let query = ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", user._id));
    
    const contacts = await query.collect();
    
    // Filter by platform if specified
    let filtered = args.platform 
      ? contacts.filter(c => c.platform === args.platform)
      : contacts;
    
    // Filter by tags if specified
    if (args.tags && args.tags.length > 0) {
      filtered = filtered.filter(c => 
        args.tags!.some(tag => c.tags.includes(tag))
      );
    }
    
    return filtered;
  },
});

export const addTag = mutation({
  args: {
    contactId: v.id("contacts"),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    
    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.userId !== user._id) {
      throw new Error("Contact not found");
    }
    
    if (!contact.tags.includes(args.tag)) {
      await ctx.db.patch(args.contactId, {
        tags: [...contact.tags, args.tag],
      });
    }
  },
});

export const removeTag = mutation({
  args: {
    contactId: v.id("contacts"),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    
    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.userId !== user._id) {
      throw new Error("Contact not found");
    }
    
    await ctx.db.patch(args.contactId, {
      tags: contact.tags.filter(t => t !== args.tag),
    });
  },
});
