import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// Session Management
export const createSession = mutation({
    args: {
        sessionId: v.string(),
        title: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);

        // Check if session already exists
        const existingSession = await ctx.db
            .query("sessions")
            .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
            .first();

        if (existingSession) {
            return existingSession._id;
        }

        // Schedule cleanup of old, single-message sessions
        await ctx.scheduler.runAfter(0, internal.cleanup.cleanupSingleMessageSessions, { userId });

        return await ctx.db.insert("sessions", {
            userId: userId || undefined,
            sessionId: args.sessionId,
            title: args.title || "New Journal Session",
            isActive: true,
            messageCount: 0,
        });
    },
});

export const getSessions = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);

        if (userId) {
            return await ctx.db
                .query("sessions")
                .withIndex("by_user", (q) => q.eq("userId", userId))
                .order("desc")
                .take(20);
        }

        return [];
    },
});

export const getActiveSession = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);

        if (userId) {
            return await ctx.db
                .query("sessions")
                .withIndex("by_user_active", (q) => q.eq("userId", userId).eq("isActive", true))
                .first();
        }

        return null;
    },
});

export const setActiveSession = mutation({
    args: {
        sessionId: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);

        if (userId) {
            // Deactivate all sessions
            const allSessions = await ctx.db
                .query("sessions")
                .withIndex("by_user", (q) => q.eq("userId", userId))
                .collect();

            for (const session of allSessions) {
                await ctx.db.patch(session._id, { isActive: false });
            }

            // Activate the selected session
            const targetSession = await ctx.db
                .query("sessions")
                .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
                .first();

            if (targetSession) {
                await ctx.db.patch(targetSession._id, { isActive: true });
            }
        }
    },
});

export const updateSessionTitle = mutation({
    args: {
        sessionId: v.string(),
        title: v.string(),
    },
    handler: async (ctx, args) => {
        const session = await ctx.db
            .query("sessions")
            .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
            .first();

        if (session) {
            await ctx.db.patch(session._id, {
                title: args.title,
                userEditedTitle: true,
            });
        }
    },
});

export const updateSessionSummary = mutation({
    args: {
        sessionId: v.string(),
        summary: v.string(),
    },
    handler: async (ctx, args) => {
        const session = await ctx.db
            .query("sessions")
            .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
            .first();

        if (session) {
            await ctx.db.patch(session._id, { summary: args.summary });
        }
    },
});

export const updateSessionTitleInternal = internalMutation({
    args: {
        sessionId: v.string(),
        title: v.string(),
    },
    handler: async (ctx, args) => {
        const session = await ctx.db
            .query("sessions")
            .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
            .first();

        if (session) {
            await ctx.db.patch(session._id, {
                title: args.title,
                titleGenerated: true,
            });
        }
    },
});