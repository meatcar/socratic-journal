import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

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
      await ctx.db.patch(session._id, { title: args.title });
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

// Chat Messages
export const getChatHistory = query({
  args: { 
    sessionId: v.string() 
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .take(100);
  },
});

export const addChatMessage = mutation({
  args: {
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    type: v.optional(v.union(v.literal("prompt"), v.literal("entry"), v.literal("feedback"))),
    sessionId: v.string(),
  },
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
      await ctx.db.patch(session._id, { 
        messageCount: session.messageCount + 1,
        isActive: true 
      });
    }
    
    return messageId;
  },
});

// Journal Entries (for substantial entries)
export const getJournalEntries = query({
  args: { 
    sessionId: v.string() 
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("journalEntries")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .take(20);
  },
});

export const saveJournalEntry = mutation({
  args: {
    content: v.string(),
    mood: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    
    return await ctx.db.insert("journalEntries", {
      userId: userId || undefined,
      sessionId: args.sessionId,
      content: args.content,
      mood: args.mood,
      tags: args.tags,
    });
  },
});

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
    const recentEntries = await ctx.runQuery(api.journal.getJournalEntries, { 
      sessionId: args.sessionId 
    });
    
    // Get chat history for this session
    const chatHistory = await ctx.runQuery(api.journal.getChatHistory, { 
      sessionId: args.sessionId 
    });
    
    // Use the bundled OpenAI from Convex
    const OpenAI = (await import("openai")).default;
    const client = new OpenAI({
      baseURL: process.env.CONVEX_OPENAI_BASE_URL,
      apiKey: process.env.CONVEX_OPENAI_API_KEY,
    });

    // Build context from recent entries and chat
    const entriesContext: string = recentEntries.slice(0, 3).map((entry: any) => 
      `Entry: ${entry.content.substring(0, 200)}...`
    ).join('\n');
    
    const chatContext: string = chatHistory.slice(-6).map((msg: any) => 
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

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: args.userMessage }
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const aiResponse: string = response.choices[0]?.message?.content || "I'm here to listen. How are you feeling today?";

    // Save AI response to chat
    await ctx.runMutation(api.journal.addChatMessage, {
      content: aiResponse,
      role: "assistant",
      type: args.isNewEntry ? "feedback" : "prompt",
      sessionId: args.sessionId,
    });

    return aiResponse;
  },
});

// Generate session summary
export const generateSessionSummary = action({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args): Promise<string | null> => {
    const chatHistory = await ctx.runQuery(api.journal.getChatHistory, { 
      sessionId: args.sessionId 
    });
    
    if (chatHistory.length < 4) return null; // Need some content to summarize
    
    const OpenAI = (await import("openai")).default;
    const client = new OpenAI({
      baseURL: process.env.CONVEX_OPENAI_BASE_URL,
      apiKey: process.env.CONVEX_OPENAI_API_KEY,
    });
    
    const conversationText: string = chatHistory.map((msg: any) => 
      `${msg.role}: ${msg.content}`
    ).join('\n');
    
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "system",
        content: `Summarize this journaling session in 2-3 sentences. Focus on key themes, emotions, and insights. Be empathetic and concise.`
      }, {
        role: "user",
        content: conversationText
      }],
      max_tokens: 100,
      temperature: 0.5,
    });
    
    const summary: string = response.choices[0]?.message?.content || "";
    
    // Update session with summary using mutation
    if (summary) {
      await ctx.runMutation(api.journal.updateSessionSummary, {
        sessionId: args.sessionId,
        summary: summary
      });
    }
    
    return summary;
  },
});
