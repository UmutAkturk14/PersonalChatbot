import { useMemo, useState } from "react";
import { createMessageId, draftAssistantReply } from "../lib/assistant";
import type { ChatMessage } from "../types/chat";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";

type ChatPanelProps = {
  personaName: string;
  personaTitle: string;
  personaSubtitle?: string;
};

function ChatPanel({ personaName, personaTitle, personaSubtitle }: ChatPanelProps) {
  const intro = useMemo(
    () =>
      `Hi! I'm ${personaName}'s chatbot. Ask me about my experience as a ${personaTitle}${
        personaSubtitle ? ` — ${personaSubtitle}` : ""
      }.`,
    [personaName, personaTitle, personaSubtitle],
  );

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "hello",
      role: "assistant",
      content: intro,
      createdAt: Date.now(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => a.createdAt - b.createdAt),
    [messages],
  );

  const handleSubmit = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: createMessageId("user"),
      role: "user",
      content: trimmed,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const reply = await draftAssistantReply([...messages, userMessage]);
      const assistantMessage: ChatMessage = {
        id: createMessageId("assistant"),
        role: "assistant",
        content: reply,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId("error"),
          role: "assistant",
          content:
            error instanceof Error
              ? `Something went wrong: ${error.message}`
              : "Something went wrong. Please try again.",
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900 to-slate-950 shadow-[0_30px_80px_-24px_rgba(15,181,199,0.35)] backdrop-blur-lg">
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-teal-200">
            Chat with {personaName}
          </p>
          <p className="text-sm text-slate-200/80">Grounded in your profile markdown</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-slate-100">
          <span className="h-2 w-2 rounded-full bg-teal-300 shadow-[0_0_0_6px_rgba(45,212,191,0.12)]" />
          Live
        </div>
      </div>

      <div className="flex flex-col gap-6 p-6">
        <div className="flex max-h-[460px] flex-col gap-3 overflow-y-auto pr-1">
          {sortedMessages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </div>

        <ChatInput isLoading={isLoading} onSubmit={handleSubmit} />
      </div>
    </section>
  );
}

export default ChatPanel;
