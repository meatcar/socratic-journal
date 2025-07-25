import { ChatMessage } from "../../lib/types";
import { formatTime } from "../../lib/utils";
import { Text } from "react-aria-components";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { role, content, _creationTime } = message;
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
          isUser ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"
        }`}
      >
        <Text className="text-sm leading-relaxed">{content}</Text>
        <Text
          className={`text-xs mt-2 ${
            isUser ? "text-blue-100" : "text-gray-500"
          }`}
        >
          {formatTime(_creationTime)}
        </Text>
      </div>
    </div>
  );
}
