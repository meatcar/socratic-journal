import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface JournalChatProps {
  sessionId: string;
}

export function JournalChat({ sessionId }: JournalChatProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatHistory = useQuery(api.journal.getChatHistory, { sessionId });
  const addChatMessage = useMutation(api.journal.addChatMessage);
  const saveJournalEntry = useMutation(api.journal.saveJournalEntry);
  const generateAIResponse = useAction(api.journal.generateAIResponse);
  const createSession = useMutation(api.journal.createSession);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage("");
    setIsLoading(true);

    try {
      // Add user message to chat
      await addChatMessage({
        content: userMessage,
        role: "user",
        type: "entry",
        sessionId,
      });

      // Save as journal entry if it's substantial
      if (userMessage.length > 20) {
        await saveJournalEntry({
          content: userMessage,
          sessionId,
        });
      }

      // Generate AI response
      await generateAIResponse({
        userMessage,
        sessionId,
        isNewEntry: userMessage.length > 20,
      });
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!chatHistory) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
        <div className="h-96 overflow-y-auto p-6 space-y-4">
          {chatHistory.map((msg) => (
            <div
              key={msg._id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <p
                  className={`text-xs mt-2 ${
                    msg.role === "user" ? "text-blue-100" : "text-gray-500"
                  }`}
                >
                  {formatTime(msg._creationTime)}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="border-t border-gray-100 p-4">
          <form
            onSubmit={(e) => {
              void handleSubmit(e);
            }}
            className="flex gap-3"
          >
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Continue your journaling session..."
              className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              rows={2}
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={!message.trim() || isLoading}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Send
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* Session Summary */}
      <div className="mt-8">
        <SessionSummary sessionId={sessionId} />
      </div>
    </div>
  );
}

function SessionSummary({ sessionId }: { sessionId: string }) {
  const entries = useQuery(api.journal.getJournalEntries, { sessionId });
  const chatHistory = useQuery(api.journal.getChatHistory, { sessionId });

  if (!entries || !chatHistory || chatHistory.length === 0) {
    return null;
  }

  const userMessages = chatHistory.filter((msg) => msg.role === "user").length;
  const journalEntries = entries.length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Session Summary
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{userMessages}</div>
          <div className="text-sm text-gray-600">Messages</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {journalEntries}
          </div>
          <div className="text-sm text-gray-600">Journal Entries</div>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">Recent Entries:</h4>
          {entries.slice(0, 2).map((entry) => (
            <div
              key={entry._id}
              className="text-left p-3 bg-gray-50 rounded-lg"
            >
              <p className="text-sm text-gray-700 line-clamp-2">
                {entry.content.substring(0, 120)}...
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(entry._creationTime).toLocaleTimeString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
