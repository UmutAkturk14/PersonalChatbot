import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import type { LanguageCode } from "../types/language";
import {
  startSpeechRecognition,
  type SpeechRecognitionHandle,
} from "../lib/speechRecognition";

type ChatInputProps = {
  isLoading: boolean;
  onSubmit: (text: string) => Promise<void>;
  language: LanguageCode;
};

function ChatInput({ isLoading, onSubmit, language }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const lastTranscriptRef = useRef("");
  const recognitionHandleRef = useRef<SpeechRecognitionHandle | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const labels =
    language === "de"
      ? {
          prompt: "Frag mich etwas",
          placeholder:
            "Zum Beispiel: Was sollte ich als Teamkollege über dich wissen?",
          sending: "Denke nach...",
          send: "Senden",
          speak: "Sprich",
          listening: "Hört zu...",
        }
      : {
          prompt: "Ask anything",
          placeholder: "Try: What should I know about you as a teammate?",
          sending: "Thinking...",
          send: "Send",
          speak: "Speak",
          listening: "Listening...",
        };

  const submitMessage = async (overrideText?: string) => {
    const text = overrideText ?? value;
    const trimmed = text.trim();

    if (!trimmed) {
      if (isListening) stopListening();
      return;
    }

    const normalized = trimmed.toLowerCase();
    if (normalized === "speak" || normalized === "sprich") {
      setValue("");
      startListening();
      return;
    }

    if (isListening) {
      stopListening();
    }
    if (isLoading) return;
    setValue("");
    await onSubmit(trimmed);
  };

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const stopListening = () => {
    setIsListening(false);
    lastTranscriptRef.current = "";
    clearSilenceTimer();
    recognitionHandleRef.current?.stop();
    recognitionHandleRef.current = null;
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

  const scheduleSubmit = (text: string) => {
    const cleaned = text.trim();
    if (!cleaned) return;
    clearSilenceTimer();
    silenceTimerRef.current = window.setTimeout(async () => {
      silenceTimerRef.current = null;
      stopListening();
      await submitMessage(cleaned);
      lastTranscriptRef.current = "";
    }, 900);
  };

  const startListening = () => {
    if (isLoading || isListening) return;
    lastTranscriptRef.current = "";
    const locale = language === "de" ? "de-DE" : "en-US";
    const handle = startSpeechRecognition({
      language: locale,
      keepAlive: false,
      continuous: true,
      interimResults: true,
      onStart: () => setIsListening(true),
      onEnd: () => {
        setIsListening(false);
        clearSilenceTimer();
      },
      onError: (message) => {
        console.error("Speech recognition error:", message);
        stopListening();
      },
      onResult: (transcript) => {
        lastTranscriptRef.current = transcript;
        setValue(transcript);
        scheduleSubmit(transcript);
      },
    });

    if (!handle) {
      setIsListening(false);
      return;
    }

    recognitionHandleRef.current = handle;
    setIsListening(true);
  };

  const handleToggleSpeech = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-inner shadow-black/40 backdrop-blur"
    >
      <label className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">
          {labels.prompt}
        </span>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={labels.placeholder}
            className="min-h-[96px] w-full flex-1 resize-none rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-50 outline-none transition focus:border-teal-300/70 focus:ring-2 focus:ring-teal-400/40"
          />
          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto">
            <button
              type="button"
              onClick={handleToggleSpeech}
              disabled={isLoading}
              className={`flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold shadow-inner shadow-black/30 transition hover:translate-y-[1px] hover:border-teal-300/50 sm:w-auto ${
                isListening
                  ? "bg-teal-500/20 text-teal-100"
                  : "bg-slate-900/70 text-slate-50"
              } ${isLoading ? "cursor-not-allowed opacity-60" : ""}`}
              aria-label={labels.speak}
              aria-pressed={isListening}
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 1.75a3.25 3.25 0 0 0-3.25 3.25v6a3.25 3.25 0 1 0 6.5 0v-6A3.25 3.25 0 0 0 12 1.75Z" />
                <path d="M19 10.5v1a7 7 0 0 1-14 0v-1" />
                <path d="M12 21.5v-3" />
              </svg>
              <span>{isListening ? labels.listening : labels.speak}</span>
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_10px_30px_-12px_rgba(45,212,191,0.65)] transition hover:translate-y-[1px] hover:shadow-[0_18px_34px_-18px_rgba(45,212,191,0.75)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isLoading ? labels.sending : labels.send}
            </button>
          </div>
        </div>
      </label>
    </form>
  );
}

export default ChatInput;
