import { Session } from "../lib/types";
import { formatDate } from "../lib/utils";
import { Button } from "./ui/Button";
import { ListBox, ListBoxItem, TextField, Input } from "react-aria-components";

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
    <ListBox
      items={sessions}
      aria-label="Sessions"
      selectionMode="single"
      selectedKeys={[currentSessionId]}
      onSelectionChange={(keys) => {
        if (keys !== "all") {
          const key = keys.values().next().value;
          if (key) {
            onSessionSelect(String(key));
          }
        }
      }}
      className="max-h-64 overflow-y-auto"
    >
      {(item) => (
        <ListBoxItem
          id={item._id}
          textValue={item.title ?? "Untitled Session"}
          className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
            item.sessionId === currentSessionId
              ? "bg-blue-50 border-blue-100"
              : ""
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {editingSessionId === item.sessionId ? (
                <div className="flex items-center gap-2">
                  <TextField
                    value={editingTitle}
                    onChange={onTitleChange}
                    aria-label="Edit session title"
                  >
                    <Input
                      className="w-full px-2 py-1 border rounded-md"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onTitleSave();
                        if (e.key === "Escape") onTitleCancel();
                      }}
                    />
                  </TextField>
                  <Button onPress={onTitleSave} variant="primary">
                    Save
                  </Button>
                  <Button onPress={onTitleCancel} variant="secondary">
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-800 text-sm">
                    {item.title || "Untitled Session"}
                  </h4>
                  <Button
                    onPress={() => onTitleEdit(item)}
                    className="text-xs ml-auto"
                  >
                    Edit
                  </Button>
                </div>
              )}
              {item.summary && (
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {item.summary}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span>{item.messageCount} messages</span>
                <span>{formatDate(item._creationTime)}</span>
                {item.isActive && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    Active
                  </span>
                )}
              </div>
            </div>

            {!item.summary && item.messageCount > 3 && (
              <Button
                onPress={() => onGenerateSummary(item.sessionId)}
                className="text-xs text-blue-600 hover:text-blue-800 ml-2"
              >
                Summarize
              </Button>
            )}
          </div>
        </ListBoxItem>
      )}
    </ListBox>
  );
}
