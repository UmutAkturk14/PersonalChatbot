import { type FormEvent, type KeyboardEvent, useState } from "react";

type ChatInputProps = {
  isLoading: boolean;
  onSubmit: (text: string) => Promise<void>;
};

function ChatInput({ isLoading, onSubmit }: ChatInputProps) {
  const [value, setValue] = useState("");

  const submitMessage = async () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    setValue("");
    await onSubmit(trimmed);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitMessage();
  };

  const handleKeyDown = async (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      await submitMessage();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-inner shadow-black/40 backdrop-blur"
    >
      <label className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">
          Ask anything
        </span>
        <div className="flex items-start gap-3">
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Try: What should I know about you as a teammate?"
            className="min-h-[80px] flex-1 resize-none rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-50 outline-none transition focus:border-teal-300/70 focus:ring-2 focus:ring-teal-400/40"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_10px_30px_-12px_rgba(45,212,191,0.65)] transition hover:translate-y-[1px] hover:shadow-[0_18px_34px_-18px_rgba(45,212,191,0.75)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Thinking..." : "Send"}
          </button>
        </div>
      </label>
    </form>
  );
}

export default ChatInput;
