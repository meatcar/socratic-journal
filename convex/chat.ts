import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { zodToConvex } from "convex-helpers/server/zod";
import {
    getChatHistorySchema,
    addChatMessageSchema,
} from "./lib/zod/messageSchemas";

// Chat Messages
export const getChatHistory = query({
    args: zodToConvex(getChatHistorySchema),
    handler: async (ctx, args) => {
        return await ctx.db
            .query("chatMessages")
            .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
            .order("asc")
            .take(100);
    },
});

export const addChatMessage = mutation({
    args: zodToConvex(addChatMessageSchema),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);

        // Insert the message
        const messageId = await ctx.db.insert("chatMessages", {
            userId: userId || undefined,
            sessionId: args.sessionId,
            role: args.role,
            content: args.content,
            type: args.type,
        });

        // Update session message count
        const session = await ctx.db
            .query("sessions")
            .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
            .first();

        if (session) {
            const newCount = session.messageCount + 1;
            await ctx.db.patch(session._id, {
                messageCount: newCount,
                isActive: true,
            });

            if (
                newCount === 6 &&
                session.title === "New Journal Session" &&
                !session.titleGenerated
            ) {
                await ctx.scheduler.runAfter(0, internal.ai.generateSessionTitle, {
                    sessionId: args.sessionId,
                });
            }
        }

        return messageId;
    },
});