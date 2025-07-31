import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  clips: defineTable({
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
  })
    .index("by_status", ["status"])
    .index("by_share_id", ["shareId"])
    .index("by_video_id", ["videoId"]),
});