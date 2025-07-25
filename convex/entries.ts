import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Journal Entries (for substantial entries)
export const getJournalEntries = query({
    args: {
        sessionId: v.string()
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("journalEntries")
            .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
            .order("desc")
            .take(20);
    },
});

export const saveJournalEntry = mutation({
    args: {
        content: v.string(),
        mood: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        sessionId: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);

        return await ctx.db.insert("journalEntries", {
            userId: userId || undefined,
            sessionId: args.sessionId,
            content: args.content,
            mood: args.mood,
            tags: args.tags,
        });
    },
});