import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  sessions: defineTable({
    userId: v.optional(v.id("users")), // Optional for anonymous users
    sessionId: v.string(), // Unique session identifier
    title: v.optional(v.string()), // Auto-generated or user-defined title
    summary: v.optional(v.string()), // AI-generated summary
    mood: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isActive: v.boolean(), // Whether this session is currently active
    messageCount: v.number(), // Number of messages in this session
  }).index("by_user", ["userId"])
    .index("by_session_id", ["sessionId"])
    .index("by_user_active", ["userId", "isActive"])
    .index("by_message_count", ["messageCount"]),

  chatMessages: defineTable({
    userId: v.optional(v.id("users")),
    sessionId: v.string(), // Links to sessions table
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    type: v.optional(v.union(v.literal("prompt"), v.literal("entry"), v.literal("feedback"))),
  }).index("by_user", ["userId"])
    .index("by_session", ["sessionId"]),

  // Keep journal entries for backward compatibility and insights
  journalEntries: defineTable({
    userId: v.optional(v.id("users")),
    sessionId: v.string(), // Links to sessions table
    content: v.string(),
    mood: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    aiInsights: v.optional(v.string()),
  }).index("by_user", ["userId"])
    .index("by_session", ["sessionId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
