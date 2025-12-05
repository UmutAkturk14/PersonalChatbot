import { useEffect, useMemo, useState } from "react";
import { createMessageId, draftAssistantReply } from "../lib/assistant";
import type { ChatMessage } from "../types/chat";
import type { LanguageCode } from "../types/language";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";

type ChatPanelProps = {
  personaName: string;
  personaTitle: string;
  personaSubtitle?: string;
  language: LanguageCode;
};

function ChatPanel({
  personaName,
  personaTitle,
  personaSubtitle,
  language,
}: ChatPanelProps) {
  const intro = useMemo(
    () =>
      language === "de"
        ? `Hallo! Ich bin der Chatbot von ${personaName}. Frag mich nach meiner Erfahrung als ${personaTitle}${
            personaSubtitle ? ` — ${personaSubtitle}` : ""
          }.`
        : `Hi! I'm ${personaName}'s chatbot. Ask me about my experience as a ${personaTitle}${
            personaSubtitle ? ` — ${personaSubtitle}` : ""
          }.`,
    [personaName, personaTitle, personaSubtitle, language]
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMessages([
      {
        id: `hello-${language}`,
        role: "assistant",
        content: intro,
        createdAt: Date.now(),
      },
    ]);
  }, [intro, language]);

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => a.createdAt - b.createdAt),
    [messages]
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
      const reply = await draftAssistantReply(
        [...messages, userMessage],
        language
      );
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

  const labels =
    language === "de"
      ? {
          chatWith: `Chat mit ${personaName}`,
          grounded: "Basiert auf deinem Profil-Markdown",
          live: "Live",
        }
      : {
          chatWith: `Chat with ${personaName}`,
          grounded: "Grounded in your profile markdown",
          live: "Live",
        };

  return (
    <section className="flex min-h-[70svh] flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900 to-slate-950 shadow-[0_30px_80px_-24px_rgba(15,181,199,0.35)] backdrop-blur-lg">
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-teal-200">
            {labels.chatWith}
          </p>
          <p className="text-sm text-slate-200/80">{labels.grounded}</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-slate-100">
          <span className="h-2 w-2 rounded-full bg-teal-300 shadow-[0_0_0_6px_rgba(45,212,191,0.12)]" />
          {labels.live}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {sortedMessages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              language={language}
            />
          ))}
        </div>

        <ChatInput
          isLoading={isLoading}
          onSubmit={handleSubmit}
          language={language}
        />
      </div>
    </section>
  );
}

export default ChatPanel;
