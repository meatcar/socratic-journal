import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { zodToConvex } from "convex-helpers/server/zod";
import {
    getJournalEntriesSchema,
    saveJournalEntrySchema,
} from "./lib/zod/entrySchemas";

// Journal Entries (for substantial entries)
export const getJournalEntries = query({
    args: zodToConvex(getJournalEntriesSchema),
    handler: async (ctx, args) => {
        return await ctx.db
            .query("journalEntries")
            .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
            .order("desc")
            .take(20);
    },
});

export const saveJournalEntry = mutation({
    args: zodToConvex(saveJournalEntrySchema),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);

        return await ctx.db.insert("journalEntries", {
            userId: userId || undefined,
            sessionId: args.sessionId,
            content: args.content,
        });
    },
});