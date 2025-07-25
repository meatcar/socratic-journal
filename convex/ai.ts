import { v } from "convex/values";
import { z } from "zod";
import { action, internalAction } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";
import { openai } from "./lib/openai";

// AI Response Generation
export const generateAIResponse = action({
    args: {
        userMessage: v.string(),
        sessionId: v.string(),
        isNewEntry: v.optional(v.boolean()),
    },
    handler: async (ctx, args): Promise<string> => {
        const userId = await getAuthUserId(ctx);

        // Get recent journal entries for context
        const recentEntries = await ctx.runQuery(api.entries.getJournalEntries, {
            sessionId: args.sessionId
        });

        // Get chat history for this session
        const chatHistory = await ctx.runQuery(api.chat.getChatHistory, {
            sessionId: args.sessionId
        });

        // Use the Vercel AI SDK
        const { generateObject } = await import("ai");

        // Build context from recent entries and chat
        const entriesContext: string = recentEntries.slice(0, 3).map((entry) =>
            `Entry: ${entry.content.substring(0, 200)}...`
        ).join('\n');

        const chatContext: string = chatHistory.slice(-6).map((msg) =>
            `${msg.role}: ${msg.content}`
        ).join('\n');

        let systemPrompt: string = `You are a thoughtful AI journaling companion. Your role is to:
1. Provide gentle, insightful prompts to encourage journaling
2. Identify patterns in the user's entries and ask thoughtful questions
3. Offer supportive feedback without being overly clinical
4. Keep responses concise and warm
5. Remember the context of this journaling session

Guidelines:
- Be empathetic and non-judgmental
- Ask open-ended questions that promote self-reflection
- Identify recurring themes, emotions, or patterns
- Encourage growth and self-awareness
- Keep responses under 60 words
- Reference previous parts of this conversation when relevant

Recent session context:
${chatContext}

Journal entries from this session:
${entriesContext}`;

        if (args.userMessage === "Start a new journaling session") {
            systemPrompt += `\n\nThis is the start of a new journaling session. Provide a warm welcome gentle and inspiring prompt to begin journaling.`;
        } else if (args.isNewEntry) {
            systemPrompt += `\n\nThe user just shared a new journal entry. Provide thoughtful feedback and ask a follow-up question that helps them reflect deeper.`;
        } else {
            systemPrompt += `\n\nContinue the conversation naturally, building on what's been shared in this session.`;
        }

        systemPrompt += `\nReply immediately below:`;

        const { object } = await generateObject({
            model: openai("gpt-4o-mini"),
            system: systemPrompt,
            prompt: args.userMessage,
            schema: z.object({
                response: z.string().describe("The AI's response to the user's message"),
            }),
            maxTokens: 200,
            temperature: 0.7,
        });
        const aiResponse = object.response;

        // Save AI response to chat
        await ctx.runMutation(api.chat.addChatMessage, {
            content: aiResponse,
            role: "assistant",
            type: args.isNewEntry ? "feedback" : "prompt",
            sessionId: args.sessionId,
        });

        return aiResponse;
    },
});

export const generateSessionTitle = internalAction({
    args: { sessionId: v.string() },
    handler: async (ctx, args): Promise<string | null> => {
        const chatHistory = await ctx.runQuery(api.chat.getChatHistory, {
            sessionId: args.sessionId,
        });

        if (chatHistory.length < 6) return null;

        const conversationText: string = chatHistory
            .map((msg) => `${msg.role}: ${msg.content}`)
            .join("\n");

        const { generateObject } = await import("ai");

        try {
            const { object } = await generateObject({
                model: openai("gpt-4o-mini"),
                system: `Generate a concise, meaningful title (3-6 words) for this journaling session. Focus on the main theme, emotion, or topic discussed. Be specific but brief.`,
                prompt: conversationText,
                schema: z.object({
                    title: z.string().describe("A concise session title"),
                }),
                maxTokens: 50,
                temperature: 0.3,
            });

            await ctx.runMutation(internal.sessions.updateSessionTitleInternal, {
                sessionId: args.sessionId,
                title: object.title,
            });

            return object.title;
        } catch (error) {
            console.error("Title generation failed:", error);
            return null;
        }
    },
});
// Generate session summary
export const generateSessionSummary = action({
    args: {
        sessionId: v.string(),
    },
    handler: async (ctx, args): Promise<string | null> => {
        const chatHistory = await ctx.runQuery(api.chat.getChatHistory, {
            sessionId: args.sessionId
        });

        if (chatHistory.length < 4) return null; // Need some content to summarize


        const conversationText: string = chatHistory.map((msg) =>
            `${msg.role}: ${msg.content}`
        ).join('\n');

        const { generateObject } = await import("ai");
        const { object: summaryObject } = await generateObject({
            model: openai("gpt-4o-mini"),
            system: `Summarize this journaling session in 2-3 sentences. Focus on key themes, emotions, and insights. Be empathetic and concise.`,
            prompt: conversationText,
            schema: z.object({
                summary: z.string().describe("The summarized text"),
            }),
            maxTokens: 100,
            temperature: 0.5,
        });
        const summary = summaryObject.summary;

        // Update session with summary using mutation
        if (summary) {
            await ctx.runMutation(api.sessions.updateSessionSummary, {
                sessionId: args.sessionId,
                summary: summary
            });
        }

        return summary;
    },
});