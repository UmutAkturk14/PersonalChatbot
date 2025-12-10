import type { ChatMessage } from "../types/chat";
import type { LanguageCode } from "../types/language";

type MessageBubbleProps = {
  message: ChatMessage;
  language: LanguageCode;
  isPending?: boolean;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatBasic(value: string) {
  return value
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<u>$1</u>");
}

function sanitizeUrl(url: string) {
  const trimmed = url.trim();
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
  return null;
}

function renderInline(text: string) {
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let cursor = 0;
  const parts: string[] = [];

  for (const match of text.matchAll(linkPattern)) {
    const [full, label, url] = match;
    const start = match.index ?? 0;
    if (start > cursor) {
      const before = text.slice(cursor, start);
      parts.push(formatBasic(escapeHtml(before)));
    }
    const safeUrl = sanitizeUrl(url);
    if (safeUrl) {
      const escapedLabel = escapeHtml(label);
      const escapedHref = escapeHtml(safeUrl);
      parts.push(
        `<a href="${escapedHref}" target="_blank" rel="noopener noreferrer" class="text-teal-200 underline decoration-teal-300/70 underline-offset-2 hover:text-teal-100">${escapedLabel}</a>`
      );
    } else {
      parts.push(formatBasic(escapeHtml(full)));
    }
    cursor = start + full.length;
  }

  if (cursor < text.length) {
    const rest = text.slice(cursor);
    parts.push(formatBasic(escapeHtml(rest)));
  }

  return parts.join("");
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

function MessageBubble({ message, language, isPending = false }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const blocks = parseBlocks(message.content);
  const labels = language === "de" ? { user: "Du", assistant: "Assistent" } : { user: "You", assistant: "Assistant" };
  const linkButtons =
    !isUser && !isPending && message.links
      ? message.links
          .map((link) => {
            const safeUrl = sanitizeUrl(link.url);
            if (!safeUrl) return null;
            return { url: safeUrl, label: link.label };
          })
          .filter((link): link is { url: string; label?: string } => Boolean(link))
      : [];

  const formatLinkLabel = (url: string) => {
    try {
      const { hostname } = new URL(url);
      return hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  };

  return (
    <article
      className={`w-full max-w-full rounded-2xl px-4 py-3 shadow-lg transition break-words sm:max-w-3xl sm:px-5 sm:py-4 ${
        isUser
          ? "ml-auto bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 shadow-[0_10px_30px_-12px_rgba(45,212,191,0.65)]"
          : "bg-white/5 text-slate-50 ring-1 ring-white/10 backdrop-blur"
      }`}
    >
      <p
        className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] ${
          isUser ? "text-slate-900/80" : "text-teal-200"
        }`}
      >
        {isUser ? labels.user : labels.assistant}
        {!isUser && isPending && (
          <span className="flex h-2 w-6 items-center justify-between">
            <span className="h-2 w-2 animate-bounce rounded-full bg-teal-200 [animation-delay:0ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-teal-200 [animation-delay:120ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-teal-200 [animation-delay:240ms]" />
          </span>
        )}
      </p>
      <div className="mt-2 space-y-3">
        {!isUser && isPending && (
          <p className="pending-text leading-relaxed text-slate-100/90">
            {message.content}
          </p>
        )}
        {blocks.map((block, index) => {
          if (!isUser && isPending) return null;
          if (block.type === "list") {
            return (
              <ul
                key={`${message.id}-list-${index}`}
                className={`list-disc space-y-1 pl-5 whitespace-pre-wrap break-words ${
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
              } whitespace-pre-wrap break-words`}
              dangerouslySetInnerHTML={{
                __html: renderInline(block.content).replace(/\n/g, "<br />"),
              }}
            />
          );
        })}
      </div>
      {linkButtons && linkButtons.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {linkButtons.map(({ url, label }) => (
            <a
              key={`${message.id}-${url}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-200 to-emerald-200 px-3 py-2 text-sm font-semibold text-slate-900 shadow-[0_12px_30px_-14px_rgba(45,212,191,0.55)] transition hover:-translate-y-[1px] hover:shadow-[0_14px_34px_-12px_rgba(45,212,191,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              {label?.trim() || formatLinkLabel(url)}
            </a>
          ))}
        </div>
      )}
    </article>
  );
}

export default MessageBubble;
