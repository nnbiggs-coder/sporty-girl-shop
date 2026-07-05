"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { appConfig } from "@/lib/config";
import { useAssistantChat } from "./useAssistantChat";
import { ChatMessageBubble } from "./ChatMessage";
import { cn } from "@/lib/utils";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, isLoading, statusText, sendMessage, clearMessages } =
    useAssistantChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, statusText]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input;
    setInput("");
    await sendMessage(text);
  }

  return (
    <>
      {/* Chat panel */}
      <div
        className={cn(
          "fixed bottom-24 right-4 z-50 flex w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl transition-all duration-200",
          open
            ? "opacity-100 translate-y-0 pointer-events-auto h-[520px] max-h-[70vh]"
            : "opacity-0 translate-y-4 pointer-events-none h-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-surface">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-600" />
            <div>
              <p className="text-sm font-semibold text-text">Shopping Concierge</p>
              <p className="text-xs text-text-muted">Ask about gear, fees & your watchlist</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                className="rounded-full px-2 py-1 text-xs text-text-muted hover:text-text hover:bg-surface-muted"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 text-text-muted hover:bg-surface-muted hover:text-text"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-8 px-2">
              <p className="text-sm font-medium text-text">
                Hi — I&apos;m your {appConfig.name} concierge.
              </p>
              <p className="mt-2 text-xs text-text-muted leading-relaxed">
                I can search live listings, check your watchlist, explain category fees,
                and share condition details — all from real marketplace data.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {[
                  "Find soccer cleats under $80",
                  "What's on my watchlist?",
                  "Fees for fencing gear?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => sendMessage(suggestion)}
                    className="rounded-full border border-border px-3 py-1 text-xs text-text-muted hover:border-brand-300 hover:text-brand-600 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessageBubble key={msg.id} role={msg.role} content={msg.content} />
          ))}

          {statusText && (
            <p className="text-xs text-text-muted text-center animate-pulse">{statusText}</p>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-border px-3 py-3 flex gap-2 bg-surface"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about gear, fees, your watchlist…"
            disabled={isLoading}
            className="flex-1 rounded-full border border-border bg-surface-muted px-4 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Floating bubble */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all",
          open
            ? "bg-surface border border-border text-text-muted hover:text-text"
            : "bg-brand-600 text-white hover:bg-brand-700 hover:scale-105"
        )}
        aria-label={open ? "Close shopping concierge" : "Open shopping concierge"}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  );
}
