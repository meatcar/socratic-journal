import { z } from "zod";

export const getChatHistorySchema = z.object({
    sessionId: z.string().uuid(),
});

export const addChatMessageSchema = z.object({
    content: z.string().min(1).max(10000),
    role: z.enum(["user", "assistant"]),
    type: z.enum(["prompt", "entry", "feedback"]).optional(),
    sessionId: z.string().uuid(),
});