import type { ChatMessage } from "../types/chat";
import type { LanguageCode } from "../types/language";

type MessageBubbleProps = {
  message: ChatMessage;
  language: LanguageCode;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInline(text: string) {
  const escaped = escapeHtml(text);
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<u>$1</u>");
}

type Block =
  | { type: "paragraph"; content: string }
  | { type: "list"; items: string[] };

function parseBlocks(text: string): Block[] {
  return text
    .trim()
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split("\n");
      const bulletLines = lines.filter((line) => /^\s*-\s+/.test(line));
      const isList = bulletLines.length === lines.length && lines.length > 0;

      if (isList) {
        const items = lines.map((line) => line.replace(/^\s*-\s+/, ""));
        return { type: "list", items };
      }

      return { type: "paragraph", content: block };
    });
}

function MessageBubble({ message, language }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const blocks = parseBlocks(message.content);
  const labels = language === "de" ? { user: "Du", assistant: "Assistent" } : { user: "You", assistant: "Assistant" };

  return (
    <article
      className={`max-w-3xl rounded-2xl px-5 py-4 shadow-lg transition ${
        isUser
          ? "ml-auto bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 shadow-[0_10px_30px_-12px_rgba(45,212,191,0.65)]"
          : "bg-white/5 text-slate-50 ring-1 ring-white/10 backdrop-blur"
      }`}
    >
      <p
        className={`text-xs font-semibold uppercase tracking-[0.08em] ${
          isUser ? "text-slate-900/80" : "text-teal-200"
        }`}
      >
        {isUser ? labels.user : labels.assistant}
      </p>
      <div className="mt-2 space-y-3">
        {blocks.map((block, index) => {
          if (block.type === "list") {
            return (
              <ul
                key={`${message.id}-list-${index}`}
                className={`list-disc space-y-1 pl-5 ${
                  isUser ? "text-slate-950/80" : "text-slate-100/90"
                }`}
                dangerouslySetInnerHTML={{
                  __html: block.items
                    .map((item) => `<li>${renderInline(item)}</li>`)
                    .join(""),
                }}
              />
            );
          }

          return (
            <p
              key={`${message.id}-p-${index}`}
              className={`leading-relaxed ${
                isUser ? "text-slate-950/80" : "text-slate-100/90"
              }`}
              dangerouslySetInnerHTML={{
                __html: renderInline(block.content).replace(/\n/g, "<br />"),
              }}
            />
          );
        })}
      </div>
    </article>
  );
}

export default MessageBubble;
