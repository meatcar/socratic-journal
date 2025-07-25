import { useState } from "react";
import { Button } from "./ui/Button";
import { FormInput } from "./ui/FormInput";
import { LoadingSpinner } from "./ui/LoadingSpinner";

interface ChatInputProps {
  onSubmit: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSubmit, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;
    onSubmit(message.trim());
    setMessage("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-3 items-start p-4 border-t border-gray-100"
    >
      <FormInput
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Continue your journaling session..."
        rows={2}
        disabled={isLoading}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
      />
      <Button type="submit" disabled={!message.trim() || isLoading}>
        {isLoading ? <LoadingSpinner /> : "Send"}
      </Button>
    </form>
  );
}
