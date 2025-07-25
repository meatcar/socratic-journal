import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Session } from "../lib/types";
import { useSessionStore } from "../lib/store";
import {
  Button,
  Menu,
  MenuItem,
  MenuTrigger,
  Popover,
} from "react-aria-components";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { SessionList } from "./SessionList";

export function SessionManager() {
  const { sessionId: currentSessionId, setSessionId: onSessionChange } =
    useSessionStore();
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

  return (
    <MenuTrigger>
      <Button className="flex items-center gap-2" aria-label="Sessions menu">
        <span className="text-sm font-medium">Sessions</span>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </Button>
      <Popover className="w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-10">
        <Menu>
          <MenuItem>
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800" id="sessions-menu">
                  Journal Sessions
                </h3>
                <Button
                  onPress={() => {
                    void handleNewSession();
                  }}
                  isDisabled={isCreatingNew}
                >
                  {isCreatingNew ? <LoadingSpinner /> : "New Session"}
                </Button>
              </div>
            </div>
          </MenuItem>
          {sessions && (
            <MenuItem>
              <SessionList
                sessions={sessions}
                currentSessionId={currentSessionId}
                editingSessionId={editingSessionId}
                editingTitle={editingTitle}
                onSessionSelect={(sessionId) =>
                  void handleSessionSelect(sessionId)
                }
                onTitleEdit={handleTitleEdit}
                onTitleSave={() => void handleTitleSave()}
                onTitleChange={setEditingTitle}
                onTitleCancel={() => setEditingSessionId(null)}
                onGenerateSummary={(sessionId) =>
                  void handleGenerateSummary(sessionId)
                }
              />
            </MenuItem>
          )}
        </Menu>
      </Popover>
    </MenuTrigger>
  );
}
