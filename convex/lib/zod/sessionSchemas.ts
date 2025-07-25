import { z } from "zod";

export const createSessionSchema = z.object({
    sessionId: z.string().uuid(),
    title: z.string().min(1).max(100).optional(),
});

export const setActiveSessionSchema = z.object({
    sessionId: z.string().uuid(),
});

export const updateSessionTitleSchema = z.object({
    sessionId: z.string().uuid(),
    title: z.string().min(1).max(100),
});

export const generateSessionSummarySchema = z.object({
    sessionId: z.string().uuid(),
});