import { z } from "zod";

export const getJournalEntriesSchema = z.object({
    sessionId: z.string().uuid(),
});

export const saveJournalEntrySchema = z.object({
    content: z.string().min(20).max(10000),
    sessionId: z.string().uuid(),
});