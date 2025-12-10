import { useEffect, useMemo, useRef, useState } from "react";
import ChatPanel from "./components/ChatPanel";
import type { LanguageCode } from "./types/language";
import { isSupportedLanguage } from "./types/language";

type PageContent = {
  greeting: string;
  name: string;
  title: string;
  subtitle: string;
  location?: string;
  availability?: string;
  highlights: string[];
  badges: string[];
};

const fallbackContent: Record<LanguageCode, PageContent> = {
  en: {
    greeting: "Hey there",
    name: "Alex Doe",
    title: "Frontend Engineer & Product Builder",
    subtitle:
      "I design and ship fast, reliable web experiences with React and TypeScript.",
    location: "Remote / EU-friendly",
    availability: "Open to new roles",
    highlights: [
      "React + TypeScript + Vite",
      "Polished UX with accessibility baked in",
      "Rapid delivery with thoughtful iteration",
    ],
    badges: ["Frontend", "Full-stack", "Product-minded", "Mentorship"],
  },
  de: {
    greeting: "Hallo",
    name: "Alex Doe",
    title: "Frontend Engineer & Produktentwickler",
    subtitle:
      "Ich baue schnelle, zuverlässige Web-Erlebnisse mit React und TypeScript.",
    location: "Remote / EU-freundlich",
    availability: "Offen für neue Rollen",
    highlights: [
      "React + TypeScript + Vite",
      "Polierter UX mit integrierter Barrierefreiheit",
      "Schnelle Lieferung mit durchdachter Iteration",
    ],
    badges: ["Frontend", "Full-stack", "Produktorientiert", "Mentoring"],
  },
};

const contentUrls: Record<LanguageCode, string> = {
  en: new URL("../content/content-en/content.json", import.meta.url).href,
  de: new URL("../content/content-de/content.json", import.meta.url).href,
};

function getInitialLanguage(): LanguageCode {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem("preferredLanguage");
  if (isSupportedLanguage(stored)) return stored;
  const browserLang = navigator.language?.toLowerCase();
  if (browserLang?.startsWith("de")) return "de";
  return "en";
}

function App() {
  const [language, setLanguage] = useState<LanguageCode>(() =>
    getInitialLanguage()
  );
  const [content, setContent] = useState<PageContent>(
    fallbackContent[language]
  );
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [isLanguagePromptOpen, setIsLanguagePromptOpen] = useState<boolean>(
    () => {
      if (typeof window === "undefined") return false;
      return !isSupportedLanguage(localStorage.getItem("preferredLanguage"));
    }
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [renderLoader, setRenderLoader] = useState(true);
  const loaderStartRef = useRef<number | null>(null);
  const hasCompletedInitialLoad = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("preferredLanguage", language);
  }, [language]);

  useEffect(() => {
    let isMounted = true;

    const loadContent = async () => {
      setIsLoadingContent(true);
      try {
        const res = await fetch(contentUrls[language] || contentUrls.en);
        if (!res.ok) throw new Error(`Failed to load content: ${res.status}`);
        const data = (await res.json()) as PageContent;
        if (!isMounted) return;
        setContent({ ...fallbackContent[language], ...data });
      } catch (error) {
        console.error("Unable to load content.json, using fallback.", error);
        if (!isMounted) return;
        setContent(fallbackContent[language] ?? fallbackContent.en);
      } finally {
        if (!isMounted) return;
        setIsLoadingContent(false);
      }
    };

    void loadContent();

    return () => {
      isMounted = false;
    };
  }, [language]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    // Show loader immediately on load start; keep it visible for a minimum to avoid flicker.
    if (hasCompletedInitialLoad.current && !showLoader) {
      return;
    }

    if (isLoadingContent) {
      if (hasCompletedInitialLoad.current) return;
      loaderStartRef.current = performance.now();
      setShowLoader(true);
      setRenderLoader(true);
      return;
    }

    const minDurationMs = prefersReducedMotion ? 200 : 700;
    const elapsed = loaderStartRef.current
      ? performance.now() - loaderStartRef.current
      : minDurationMs;
    const remaining = Math.max(0, minDurationMs - elapsed);

    const timer = window.setTimeout(() => {
      setShowLoader(false);
      hasCompletedInitialLoad.current = true;
    }, remaining);
    return () => window.clearTimeout(timer);
  }, [isLoadingContent, prefersReducedMotion, loaderStartRef, showLoader]);

  useEffect(() => {
    if (showLoader) {
      setRenderLoader(true);
      return;
    }
    const fadeOutMs = prefersReducedMotion ? 120 : 360;
    const timer = window.setTimeout(() => setRenderLoader(false), fadeOutMs);
    return () => window.clearTimeout(timer);
  }, [showLoader, prefersReducedMotion]);

  const handleLanguageSelect = (nextLanguage: LanguageCode) => {
    setLanguage(nextLanguage);
    setIsLanguagePromptOpen(false);
  };

  const strings = useMemo(
    () =>
      language === "de"
        ? {
            snapshot: "Kurzprofil",
            loading: "Lädt...",
            live: "Live",
            location: "Standort",
            availability: "Verfügbarkeit",
            highlights: "Highlights",
            grounded: "Der Chat bezieht sich auf deine",
            languageLabel: "Sprache",
            overlayTitle: "Sprache wählen",
            overlayQuestion: "English oder Deutsch?",
            overlayRemember: "Wir merken uns deine Auswahl fürs nächste Mal.",
          }
        : {
            snapshot: "Snapshot",
            loading: "Loading...",
            live: "Live",
            location: "Location",
            availability: "Availability",
            highlights: "Highlights",
            grounded: "The chat below is grounded in your",
            languageLabel: "Language",
            overlayTitle: "Choose your language",
            overlayQuestion: "English or Deutsch?",
            overlayRemember: "We'll remember your choice for next time.",
          },
    [language]
  );

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50"
      lang={language}
    >
      {renderLoader && (
        <div
          className={`loading-overlay fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-slate-950 transition-opacity ${
            showLoader ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          data-reduced-motion={prefersReducedMotion ? "true" : "false"}
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="loading-rings" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="loading-text text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-200">
              Loading
            </p>
          </div>
        </div>
      )}
      {isLanguagePromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-6 backdrop-blur">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/90 p-6 text-center shadow-2xl shadow-teal-500/20">
            <p className="text-sm uppercase tracking-[0.2em] text-teal-200">
              {strings.overlayTitle}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {strings.overlayQuestion}
            </h2>
            <p className="mt-3 text-sm text-slate-300">
              {strings.overlayRemember}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => handleLanguageSelect("en")}
                className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-teal-400/20 transition hover:translate-y-[1px] sm:w-auto"
              >
                English
              </button>
              <button
                type="button"
                onClick={() => handleLanguageSelect("de")}
                className="w-full rounded-2xl border border-white/15 bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-400/10 transition hover:translate-y-[1px] sm:w-auto"
              >
                Deutsch
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-teal-500/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-80 w-96 rounded-full bg-indigo-500/15 blur-[140px]" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:gap-10 lg:px-8">
        <div className="fixed right-4 top-4 z-30 sm:right-6 sm:top-6">
          <label className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-100 shadow-lg shadow-teal-500/10 backdrop-blur">
            <span className="hidden text-slate-300 sm:inline">
              {strings.languageLabel}
            </span>
            <select
              value={language}
              onChange={(event) =>
                handleLanguageSelect(event.target.value as LanguageCode)
              }
              className="rounded-full border border-white/10 bg-slate-800 px-2 py-1 text-xs font-semibold text-white outline-none"
            >
              <option value="en">English</option>
              <option value="de">Deutsch</option>
            </select>
          </label>
        </div>

        <header className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-teal-500/15 backdrop-blur sm:p-6">
            <p className="text-[11px] uppercase tracking-[0.24em] text-teal-200">
              {content.greeting}
            </p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
              {content.name}
            </h1>
            <p className="mt-3 text-base font-semibold text-teal-100 sm:text-lg">
              {content.title}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-200/90 sm:text-base">
              {content.subtitle}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {content.badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-100 sm:text-xs"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <aside className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-5 shadow-xl shadow-indigo-500/10 backdrop-blur sm:p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-teal-100">
                {strings.snapshot}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-100">
                {isLoadingContent ? strings.loading : strings.live}
              </span>
            </div>
            <ul className="space-y-2 text-sm text-slate-100/90">
              <li>
                <span className="text-slate-400">{strings.location}:</span>{" "}
                {content.location}
              </li>
              <li>
                <span className="text-slate-400">{strings.availability}:</span>{" "}
                {content.availability}
              </li>
            </ul>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-200">
                {strings.highlights}
              </p>
              <ul className="mt-3 space-y-2 text-sm text-slate-100/90">
                {content.highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-2">
                    <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-teal-300" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </header>

        <ChatPanel
          personaName={content.name}
          personaTitle={content.title}
          personaSubtitle={content.subtitle}
          language={language}
        />
      </div>
    </main>
  );
}

export default App;
