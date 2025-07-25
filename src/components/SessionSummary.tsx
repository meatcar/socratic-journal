import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ChatMessage, JournalEntry } from "../lib/types";

export function SessionSummary({ sessionId }: { sessionId: string }) {
  const entries = useQuery(api.entries.getJournalEntries, { sessionId });
  const chatHistory = useQuery(api.chat.getChatHistory, { sessionId });

  if (!entries || !chatHistory || chatHistory.length === 0) {
    return null;
  }

  const userMessages = chatHistory.filter(
    (msg: ChatMessage) => msg.role === "user"
  ).length;
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
          {entries.slice(0, 2).map((entry: JournalEntry) => (
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
