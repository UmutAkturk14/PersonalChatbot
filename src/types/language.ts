type LanguageCode = "en" | "de";

const supportedLanguages: LanguageCode[] = ["en", "de"];

function isSupportedLanguage(value: string | null): value is LanguageCode {
  return value === "en" || value === "de";
}

export type { LanguageCode };
export { supportedLanguages, isSupportedLanguage };
