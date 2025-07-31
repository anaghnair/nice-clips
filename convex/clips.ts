import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { nanoid } from "nanoid";

export const createClip = mutation({
  args: {
    videoId: v.string(),
    title: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    originalTitle: v.optional(v.string()),
  },
  returns: v.id("clips"),
  handler: async (ctx, args) => {
    const duration = args.endTime - args.startTime;
    
    if (duration > 120) {
      throw new Error("Clip duration cannot exceed 2 minutes (120 seconds)");
    }
    
    if (duration <= 0) {
      throw new Error("End time must be after start time");
    }

    const shareId = nanoid(10);
    
    return await ctx.db.insert("clips", {
      videoId: args.videoId,
      title: args.title,
      startTime: args.startTime,
      endTime: args.endTime,
      duration,
      status: "processing",
      shareId,
      originalTitle: args.originalTitle,
      createdAt: Date.now(),
    });
  },
});

export const getAllClips = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("clips"),
    _creationTime: v.number(),
    videoId: v.string(),
    title: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    duration: v.number(),
    status: v.union(
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    videoUrl: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    shareId: v.string(),
    originalTitle: v.optional(v.string()),
    createdAt: v.number(),
  })),
  handler: async (ctx) => {
    return await ctx.db
      .query("clips")
      .order("desc")
      .collect();
  },
});

export const getClipByShareId = query({
  args: { shareId: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("clips"),
      _creationTime: v.number(),
      videoId: v.string(),
      title: v.string(),
      startTime: v.number(),
      endTime: v.number(),
      duration: v.number(),
      status: v.union(
        v.literal("processing"),
        v.literal("completed"),
        v.literal("failed")
      ),
      videoUrl: v.optional(v.string()),
      thumbnailUrl: v.optional(v.string()),
      shareId: v.string(),
      originalTitle: v.optional(v.string()),
      createdAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clips")
      .withIndex("by_share_id", (q) => q.eq("shareId", args.shareId))
      .unique();
  },
});

export const updateClipTitle = mutation({
  args: {
    clipId: v.id("clips"),
    title: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.clipId, {
      title: args.title,
    });
    return null;
  },
});

export const updateClipStatus = mutation({
  args: {
    clipId: v.id("clips"),
    status: v.union(
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    videoUrl: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updateData: any = { status: args.status };
    
    if (args.videoUrl) {
      updateData.videoUrl = args.videoUrl;
    }
    
    if (args.thumbnailUrl) {
      updateData.thumbnailUrl = args.thumbnailUrl;
    }
    
    await ctx.db.patch(args.clipId, updateData);
    return null;
  },
});

export const deleteClip = mutation({
  args: { clipId: v.id("clips") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.clipId);
    return null;
  },
});

export const getProcessingClips = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("clips"),
    _creationTime: v.number(),
    videoId: v.string(),
    title: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    duration: v.number(),
    status: v.union(
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    videoUrl: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    shareId: v.string(),
    originalTitle: v.optional(v.string()),
    createdAt: v.number(),
  })),
  handler: async (ctx) => {
    return await ctx.db
      .query("clips")
      .withIndex("by_status", (q) => q.eq("status", "processing"))
      .collect();
  },
});