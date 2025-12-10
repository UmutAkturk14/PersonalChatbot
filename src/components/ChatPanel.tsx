import { useEffect, useMemo, useState } from "react";
import { createMessageId, draftAssistantReply } from "../lib/assistant";
import type { ChatMessage, LinkPreview } from "../types/chat";
import type { LanguageCode } from "../types/language";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";

type ChatPanelProps = {
  personaName: string;
  personaTitle: string;
  personaSubtitle?: string;
  language: LanguageCode;
};

function extractLinks(text: string, linkLabelMap?: Map<string, string>): LinkPreview[] {
  const markdownPattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi;
  const urlPattern = /\bhttps?:\/\/[^\s)<>\]]+/gi;
  const seen = new Set<string>();
  const links: LinkPreview[] = [];

  const isGenericLabel = (label: string) => {
    const normalized = label.trim().toLowerCase();
    return ["here", "link", "this", "repo", "live", "website", "demo", "view"].includes(normalized);
  };

  const sanitize = (raw: string) => {
    const trimmed = raw.replace(/[),.]+$/, "");
    try {
      const url = new URL(trimmed);
      if (url.protocol !== "http:" && url.protocol !== "https:") return null;
      return url.toString();
    } catch {
      return null;
    }
  };

  for (const match of text.matchAll(markdownPattern)) {
    const [, label, rawUrl] = match;
    const url = sanitize(rawUrl);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const mappedLabel = linkLabelMap?.get(url);
    links.push({
      url,
      label: mappedLabel || (isGenericLabel(label) ? undefined : label.trim()),
    });
  }

  for (const match of text.matchAll(urlPattern)) {
    const url = sanitize(match[0]);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    links.push({ url, label: linkLabelMap?.get(url) });
  }

  return links;
}

function ChatPanel({
  personaName,
  personaTitle,
  personaSubtitle,
  language,
}: ChatPanelProps) {
  const projectsUrl = useMemo(
    () => new URL("../content/content-en/projects.json", import.meta.url).href,
    []
  );
  const [linkLabelMap, setLinkLabelMap] = useState<Map<string, string>>(new Map());
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
  const [pendingMessage, setPendingMessage] = useState<ChatMessage | null>(null);

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

  useEffect(() => {
    let isMounted = true;
    const loadProjects = async () => {
      try {
        const res = await fetch(projectsUrl);
        if (!res.ok) throw new Error(`Failed to load projects.json: ${res.status}`);
        const data: Array<{ name?: string; links?: Record<string, string> }> =
          await res.json();
        if (!isMounted) return;
        const map = new Map<string, string>();
        for (const project of data) {
          if (!project?.name || !project.links) continue;
          for (const [key, url] of Object.entries(project.links)) {
            if (!url) continue;
            map.set(url, `${project.name} — ${key === "live" ? "Live" : key}`);
          }
        }
        setLinkLabelMap(map);
      } catch (error) {
        console.warn("Unable to load projects link labels.", error);
      }
    };
    void loadProjects();
    return () => {
      isMounted = false;
    };
  }, [projectsUrl]);

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
    setPendingMessage({
      id: `pending-${Date.now()}`,
      role: "assistant",
      content: language === "de" ? "Denke nach..." : "Thinking...",
      createdAt: Date.now(),
    });

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
        links: extractLinks(reply, linkLabelMap),
      };
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== pendingMessage?.id),
        assistantMessage,
      ]);
      setPendingMessage(null);
    } catch (error) {
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== pendingMessage?.id),
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
      setPendingMessage(null);
    } finally {
      setIsLoading(false);
    }
  };

  const labels =
    language === "de"
      ? {
          chatWith: `Chat mit ${personaName}`,
          live: "Live",
        }
      : {
          chatWith: `Chat with ${personaName}`,
          live: "Live",
        };

  return (
    <section className="flex min-h-[70svh] flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900 to-slate-950 shadow-[0_30px_80px_-24px_rgba(15,181,199,0.35)] backdrop-blur-lg">
      <div className="flex flex-col gap-3 border-b border-white/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-teal-200">
            {labels.chatWith}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-slate-100 sm:self-center">
          <span className="h-2 w-2 rounded-full bg-teal-300 shadow-[0_0_0_6px_rgba(45,212,191,0.12)]" />
          {labels.live}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {sortedMessages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              language={language}
            />
          ))}
          {pendingMessage && (
            <MessageBubble
              key={pendingMessage.id}
              message={pendingMessage}
              language={language}
              isPending
            />
          )}
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
