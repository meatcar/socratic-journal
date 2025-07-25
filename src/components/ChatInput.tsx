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
      className="flex gap-3 items-stretch p-4 border-t border-gray-100"
    >
      <FormInput
        value={message}
        onChange={(e) => setMessage(typeof e === "string" ? e : e.target.value)}
        placeholder="Continue your journaling session..."
        rows={2}
        isDisabled={isLoading}
        onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as unknown as React.FormEvent);
          }
        }}
        aria-label="Journal entry input"
      />
      <Button
        type="submit"
        isDisabled={!message.trim() || isLoading}
        className="h-full"
        aria-label="Send journal entry"
      >
        {isLoading ? <LoadingSpinner /> : "Send"}
      </Button>
    </form>
  );
}
