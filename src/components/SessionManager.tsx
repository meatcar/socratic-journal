import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Session } from "../lib/types";

interface SessionManagerProps {
  currentSessionId: string;
  onSessionChange: (sessionId: string) => void;
}

export function SessionManager({
  currentSessionId,
  onSessionChange,
}: SessionManagerProps) {
  const [showSessions, setShowSessions] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const sessions = useQuery(api.sessions.getSessions);
  const setActiveSession = useMutation(api.sessions.setActiveSession);
  const updateSessionTitle = useMutation(api.sessions.updateSessionTitle);
  const generateSessionSummary = useAction(api.ai.generateSessionSummary);

  const handleNewSession = async () => {
    setIsCreatingNew(true);
    try {
      const newSessionId = crypto.randomUUID();
      onSessionChange(newSessionId);
      toast.success("New session started");
    } catch (error) {
      console.error("Error creating new session:", error);
      toast.error("Failed to create new session");
    } finally {
      setIsCreatingNew(false);
      setShowSessions(false);
    }
  };

  const handleSessionSelect = async (sessionId: string) => {
    try {
      await setActiveSession({ sessionId });
      onSessionChange(sessionId);
      setShowSessions(false);
      toast.success("Session switched");
    } catch (error) {
      console.error("Error switching session:", error);
      toast.error("Failed to switch session");
    }
  };

  const handleGenerateSummary = async (sessionId: string) => {
    try {
      await generateSessionSummary({ sessionId });
      toast.success("Summary generated");
    } catch (error) {
      console.error("Error generating summary:", error);
      toast.error("Failed to generate summary");
    }
  };

  const handleTitleEdit = (session: Session) => {
    setEditingSessionId(session.sessionId);
    setEditingTitle(session.title ?? "");
  };

  const handleTitleSave = async () => {
    if (!editingSessionId || !editingTitle) return;
    try {
      await updateSessionTitle({
        sessionId: editingSessionId,
        title: editingTitle,
      });
      toast.success("Title updated");
      setEditingSessionId(null);
    } catch (error) {
      console.error("Error updating title:", error);
      toast.error("Failed to update title");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowSessions(!showSessions)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium">Sessions</span>
        <svg
          className={`w-4 h-4 transition-transform ${showSessions ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {showSessions && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-10">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Journal Sessions</h3>
              <button
                onClick={() => {
                  void handleNewSession();
                }}
                disabled={isCreatingNew}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {isCreatingNew ? "Creating..." : "New Session"}
              </button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {sessions && sessions.length > 0 ? (
              sessions.map((session: Session) => (
                <div
                  key={session._id}
                  className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                    session.sessionId === currentSessionId
                      ? "bg-blue-50 border-blue-100"
                      : ""
                  }`}
                  onClick={() => {
                    void handleSessionSelect(session.sessionId);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {editingSessionId === session.sessionId ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            className="w-full px-2 py-1 border rounded-md"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") void handleTitleSave();
                              if (e.key === "Escape") setEditingSessionId(null);
                            }}
                          />
                          <button
                            onClick={() => {
                              void handleTitleSave();
                            }}
                            className="text-green-500"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingSessionId(null)}
                            className="text-red-500"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-800 text-sm">
                            {session.title || "Untitled Session"}
                          </h4>
                          <button
                            onClick={() => handleTitleEdit(session)}
                            className="text-xs text-blue-500"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                      {session.summary && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {session.summary}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>{session.messageCount} messages</span>
                        <span>{formatDate(session._creationTime)}</span>
                        {session.isActive && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                    </div>

                    {!session.summary && session.messageCount > 3 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleGenerateSummary(session.sessionId);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 ml-2"
                      >
                        Summarize
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">
                No sessions yet. Start journaling to create your first session!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
