"use client";

import { useMemo, useState } from "react";
import { trackGaEvent } from "@/lib/analytics/ga";

type LeadDraft = {
  name: string | null;
  phone: string | null;
  intent: string | null;
  preferredCallbackWindow: string | null;
  callbackReason: string | null;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function createSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function WebChatWidget({ slug }: { slug: string }) {
  const sessionId = useMemo(() => createSessionId(), []);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi, I am Deskcaptain AI receptionist. I can help with your request and arrange a callback.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<LeadDraft>({
    name: null,
    phone: null,
    intent: null,
    preferredCallbackWindow: null,
    callbackReason: null,
  });
  const [qualified, setQualified] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    if (!chatStarted) {
      trackGaEvent("chat_started", { channel: "web" });
      setChatStarted(true);
    }

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/reception/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          message: trimmed,
          sessionId,
          history: messages.slice(-8).map((entry) => ({
            role: entry.role,
            content: entry.content,
          })),
          draft,
        }),
      });

      const data = (await response.json()) as {
        ok: boolean;
        error?: string;
        assistantMessage?: string;
        draft?: LeadDraft;
        qualified?: boolean;
      };

      if (!response.ok || !data.ok || !data.assistantMessage) {
        throw new Error(data.error ?? "Chat request failed");
      }
      const assistantMessage = data.assistantMessage;

      setDraft(data.draft ?? draft);
      const becameQualified = Boolean(data.qualified) && !qualified;
      setQualified(!!data.qualified);
      if (becameQualified) {
        trackGaEvent("lead_qualified", { channel: "web" });
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: assistantMessage },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "AI receptionist is currently unavailable. Please try again shortly, or leave your name, number, and reason for contact.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className="rounded-2xl border bg-base-100 p-4 shadow-sm"
      aria-label="AI receptionist chat"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">AI Receptionist Chat</h2>
        <span className={`badge ${qualified ? "badge-success" : "badge-outline"}`}>
          {qualified ? "Qualified lead captured" : "Collecting details"}
        </span>
      </div>

      <div
        className="mb-3 h-64 overflow-y-auto rounded-xl border bg-base-200/50 p-3"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        <ul className="space-y-2">
          {messages.map((message, index) => (
            <li
              key={`${message.role}-${index}`}
              className={`rounded-lg p-2 text-sm ${
                message.role === "assistant"
                  ? "bg-base-100 border"
                  : "bg-primary text-primary-content"
              }`}
            >
              <span className="sr-only">
                {message.role === "assistant" ? "Assistant says: " : "You said: "}
              </span>
              {message.content}
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={onSubmit} className="space-y-2">
        <label htmlFor="reception-chat-input" className="sr-only">
          Message the receptionist
        </label>
        <textarea
          id="reception-chat-input"
          className="textarea textarea-bordered w-full"
          placeholder="Tell us what you need help with"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          aria-describedby={error ? "reception-chat-error" : undefined}
        />
        <div className="flex items-center justify-between gap-2">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || input.trim().length === 0}
          >
            {loading ? "Sending..." : "Send"}
          </button>
          <p className="text-xs opacity-70">
            Please include your name, callback number, and what you need.
          </p>
        </div>
        {error && (
          <p id="reception-chat-error" className="text-sm text-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}

