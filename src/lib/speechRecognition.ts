import type {
  SpeechRecognitionConstructor,
  SpeechRecognitionScope,
  StartSpeechRecognitionOptions,
  SpeechRecognitionEventLike,
  SpeechRecognitionHandle,
} from "../types/speechRecognition";

const getRecognitionConstructor = (): SpeechRecognitionConstructor | null => {
  if (typeof globalThis === "undefined") return null;
  const speechWindow = globalThis as SpeechRecognitionScope;
  return (
    speechWindow.SpeechRecognition ||
    speechWindow.webkitSpeechRecognition ||
    null
  );
};

const resolveLanguage = (override?: string): string => {
  if (override) return override;

  if (typeof globalThis !== "undefined") {
    try {
      const stored =
        globalThis.localStorage?.getItem("preferredLanguage") ?? "";
      const normalized = stored.toLowerCase();
      if (normalized.startsWith("de")) return "de-DE";
      if (normalized.startsWith("en")) return "en-US";
    } catch {
      // Access to localStorage can throw in some environments; fall through to navigator.
    }
  }

  if (typeof navigator !== "undefined" && navigator.language) {
    return navigator.language;
  }

  return "en-US";
};

const startSpeechRecognition = (
  options: StartSpeechRecognitionOptions
): SpeechRecognitionHandle | null => {
  const Recognition = getRecognitionConstructor();
  if (!Recognition) {
    console.warn("Speech recognition is not supported in this browser.");
    options.onError?.("Speech recognition not supported");
    return null;
  }

  const recognition = new Recognition();
  const restartDelay = options.restartDelayMs ?? 300;
  let shouldStop = false;
  let restartTimeout: ReturnType<typeof setTimeout> | null = null;

  const start = () => {
    if (shouldStop) return;
    try {
      recognition.start();
    } catch (error) {
      // InvalidStateError fires when start is called while already running; ignore in keep-alive loops.
      if (
        !(
          error instanceof DOMException &&
          (error.name === "InvalidStateError" ||
            error.name === "NotAllowedError")
        )
      ) {
        options.onError?.(
          error instanceof Error
            ? error.message
            : "Speech recognition failed to start"
        );
      }
    }
  };

  recognition.lang = resolveLanguage(options.language);
  recognition.continuous = options.continuous ?? true;
  recognition.interimResults = options.interimResults ?? true;

  recognition.onstart = () => options.onStart?.();
  recognition.onend = () => {
    options.onEnd?.();
    if (options.keepAlive && !shouldStop) {
      restartTimeout = globalThis.setTimeout(start, restartDelay);
    }
  };
  recognition.onerror = (event) => {
    const errorMessage = event?.error || "Speech recognition error";
    options.onError?.(errorMessage);
    if (options.keepAlive && !shouldStop) {
      restartTimeout = globalThis.setTimeout(start, restartDelay);
    }
  };
  recognition.onresult = (event: SpeechRecognitionEventLike) => {
    const transcripts = Array.from(event.results)
      .slice(event.resultIndex)
      .map((result) => result[0]?.transcript?.trim() ?? "");
    const combined = transcripts.join(" ").trim();

    if (combined) {
      options.onResult(combined);
    }
  };

  start();

  return {
    stop: () => {
      shouldStop = true;
      if (restartTimeout !== null) {
        globalThis.clearTimeout(restartTimeout);
        restartTimeout = null;
      }
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onstart = null;
      recognition.onend = null;
      recognition.stop();
    },
  };
};

export type { SpeechRecognitionHandle, StartSpeechRecognitionOptions };
export { startSpeechRecognition };
