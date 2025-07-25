import { v } from "convex/values";
import { internalAction, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Session Cleanup
export const cleanupSingleMessageSessions = internalAction({
    args: { userId: v.union(v.id("users"), v.null()) },
    handler: async (ctx, args) => {
        if (!args.userId) {
            // We only clean up sessions for logged-in users.
            return;
        }
        const sessions = await ctx.runQuery(internal.cleanup.getSingleMessageSessions, { userId: args.userId });

        for (const session of sessions) {
            await ctx.runMutation(internal.cleanup.deleteSessionAndMessages, {
                sessionId: session.sessionId,
            });
        }
    },
});

export const getSingleMessageSessions = internalQuery({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("sessions")
            .withIndex("by_user_message_count", (q) =>
                q.eq("userId", args.userId).eq("messageCount", 1)
            )
            .collect();
    },
});

export const deleteSessionAndMessages = internalMutation({
    args: { sessionId: v.string() },
    handler: async (ctx, args) => {
        const session = await ctx.db
            .query("sessions")
            .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
            .first();

        if (session) {
            await ctx.db.delete(session._id);
        }

        const messages = await ctx.db
            .query("chatMessages")
            .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
            .collect();

        for (const message of messages) {
            await ctx.db.delete(message._id);
        }
    },
});