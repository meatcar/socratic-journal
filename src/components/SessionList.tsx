import { Session } from "../lib/types";
import { formatDate } from "../lib/utils";
import { Button } from "./ui/Button";

interface SessionListProps {
  sessions: Session[];
  currentSessionId: string;
  editingSessionId: string | null;
  editingTitle: string;
  onSessionSelect: (sessionId: string) => void;
  onTitleEdit: (session: Session) => void;
  onTitleSave: () => void;
  onTitleChange: (title: string) => void;
  onTitleCancel: () => void;
  onGenerateSummary: (sessionId: string) => void;
}

export function SessionList({
  sessions,
  currentSessionId,
  editingSessionId,
  editingTitle,
  onSessionSelect,
  onTitleEdit,
  onTitleSave,
  onTitleChange,
  onTitleCancel,
  onGenerateSummary,
}: SessionListProps) {
  return (
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
            onClick={() => onSessionSelect(session.sessionId)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {editingSessionId === session.sessionId ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => onTitleChange(e.target.value)}
                      className="w-full px-2 py-1 border rounded-md"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onTitleSave();
                        if (e.key === "Escape") onTitleCancel();
                      }}
                    />
                    <Button onClick={onTitleSave} variant="primary">
                      Save
                    </Button>
                    <Button onClick={onTitleCancel} variant="secondary">
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-800 text-sm">
                      {session.title || "Untitled Session"}
                    </h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTitleEdit(session);
                      }}
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
                    onGenerateSummary(session.sessionId);
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
  );
}
