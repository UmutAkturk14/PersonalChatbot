type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript?: string };
};

type SpeechRecognitionErrorEventLike = {
  error?: string;
};

type SpeechRecognitionScope = typeof globalThis & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

type StartSpeechRecognitionOptions = {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  keepAlive?: boolean;
  restartDelayMs?: number;
  onResult: (transcript: string) => void;
  onError?: (message: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
};

type SpeechRecognitionHandle = {
  stop: () => void;
};

export type {
  SpeechRecognitionConstructor,
  SpeechRecognitionErrorEventLike,
  SpeechRecognitionEventLike,
  SpeechRecognitionHandle,
  SpeechRecognitionInstance,
  SpeechRecognitionResultLike,
  SpeechRecognitionScope,
  StartSpeechRecognitionOptions,
};
