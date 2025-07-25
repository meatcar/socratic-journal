import { cronJobs } from "convex/server";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const cleanupSingleMessageSessions = internalAction({
    args: {},
    handler: async (ctx) => {
        const sessions = await ctx.runQuery(internal.crons.getSingleMessageSessions);

        for (const session of sessions) {
            await ctx.runMutation(internal.crons.deleteSessionAndMessages, {
                sessionId: session.sessionId,
            });
        }
    },
});

export const getSingleMessageSessions = internalQuery({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("sessions")
            .withIndex("by_message_count", (q) => q.eq("messageCount", 1))
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
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
    "Clean up single-message sessions",
    { hours: 24 }, // Run once a day
    internal.crons.cleanupSingleMessageSessions,
);

export default crons;