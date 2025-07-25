import { Id } from "../../convex/_generated/dataModel";

export type Session = {
    _id: Id<"sessions">;
    _creationTime: number;
    userId?: Id<"users">;
    sessionId: string;
    title?: string;
    summary?: string;
    mood?: string;
    tags?: string[];
    isActive: boolean;
    messageCount: number;
    titleGenerated?: boolean;
    userEditedTitle?: boolean;
};

export type ChatMessage = {
    _id: Id<"chatMessages">;
    _creationTime: number;
    userId?: Id<"users">;
    sessionId: string;
    role: "user" | "assistant";
    content: string;
    type?: "prompt" | "entry" | "feedback";
};

export type JournalEntry = {
    _id: Id<"journalEntries">;
    _creationTime: number;
    userId?: Id<"users">;
    sessionId: string;
    content: string;
    mood?: string;
    tags?: string[];
    aiInsights?: string;
};