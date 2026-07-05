"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

function renderContent(text: string) {
  const parts = text.split(/(\/listings\/[a-f0-9-]+)/gi);
  return parts.map((part, i) => {
    if (part.match(/^\/listings\/[a-f0-9-]+$/i)) {
      return (
        <Link
          key={i}
          href={part}
          className="text-brand-600 underline hover:text-brand-700"
        >
          {part}
        </Link>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function ChatMessageBubble({ role, content }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-brand-600 text-white rounded-br-md"
            : "bg-surface-muted text-text border border-border rounded-bl-md"
        )}
      >
        {content ? (
          <div className="whitespace-pre-wrap">{renderContent(content)}</div>
        ) : (
          <span className="text-text-muted animate-pulse">…</span>
        )}
      </div>
    </div>
  );
}
