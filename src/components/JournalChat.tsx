import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { ChatMessage } from "../lib/types";
import { useSessionStore } from "../lib/store";
import { MessageBubble } from "./ui/MessageBubble";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { ChatInput } from "./ChatInput";
import { SessionSummary } from "./SessionSummary";
import { ChatSkeleton } from "./ChatSkeleton";

export function JournalChat() {
  const sessionId = useSessionStore((state) => state.sessionId);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatHistory = useQuery(api.chat.getChatHistory, { sessionId });
  const addChatMessage = useMutation(api.chat.addChatMessage);
  const saveJournalEntry = useMutation(api.entries.saveJournalEntry);
  const generateAIResponse = useAction(api.ai.generateAIResponse);
  const createSession = useMutation(api.sessions.createSession);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // Create session and send initial prompt if no chat history
  useEffect(() => {
    if (chatHistory && chatHistory.length === 0) {
      void handleInitialSetup();
    }
  }, [chatHistory]);

  const handleInitialSetup = async () => {
    try {
      // Create the session first
      await createSession({ sessionId });

      // Then generate initial prompt
      await generateAIResponse({
        userMessage: "Start a new journaling session",
        sessionId,
        isNewEntry: false,
      });
    } catch (error) {
      console.error("Error setting up session:", error);
    }
  };

  const handleSubmit = async (message: string) => {
    setIsLoading(true);

    try {
      // Add user message to chat
      await addChatMessage({
        content: message,
        role: "user",
        type: "entry",
        sessionId,
      });

      // Save as journal entry if it's substantial
      if (message.length > 20) {
        await saveJournalEntry({
          content: message,
          sessionId,
        });
      }

      // Generate AI response
      await generateAIResponse({
        userMessage: message,
        sessionId,
        isNewEntry: message.length > 20,
      });
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!chatHistory) {
    return <ChatSkeleton />;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
        {/* Session Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Current Session
              </h2>
              <p className="text-sm text-gray-600">
                {chatHistory.length} messages • Started{" "}
                {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Active</span>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {chatHistory.map((msg: ChatMessage) => (
            <MessageBubble key={msg._id} message={msg} />
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <LoadingSpinner />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <ChatInput
          onSubmit={(message) => void handleSubmit(message)}
          isLoading={isLoading}
        />
      </div>

      {/* Session Summary */}
      <div className="mt-8">
        <SessionSummary sessionId={sessionId} />
      </div>
    </div>
  );
}
