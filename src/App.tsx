import { useEffect, useState } from "react";
import ChatPanel from "./components/ChatPanel";

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

const fallbackContent: PageContent = {
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
};

const contentUrl = new URL("../content/content.json", import.meta.url).href;

function App() {
  const [content, setContent] = useState<PageContent>(fallbackContent);
  const [isLoadingContent, setIsLoadingContent] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const res = await fetch(contentUrl);
        if (!res.ok) throw new Error(`Failed to load content: ${res.status}`);
        const data = (await res.json()) as PageContent;
        setContent({ ...fallbackContent, ...data });
      } catch (error) {
        console.error("Unable to load content.json, using fallback.", error);
        setContent(fallbackContent);
      } finally {
        setIsLoadingContent(false);
      }
    };

    void loadContent();
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-teal-500/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-80 w-96 rounded-full bg-indigo-500/15 blur-[140px]" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 lg:px-8">
        <header className="gap-6 lg:grid-cols-[1.4fr_1fr] flex lg:items-start">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-teal-500/15 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.24em] text-teal-200">
              {content.greeting}
            </p>
            <h1 className="mt-2 text-4xl font-semibold leading-tight sm:text-5xl">
              {content.name}
            </h1>
            <p className="mt-3 text-lg font-semibold text-teal-100">
              {content.title}
            </p>
            <p className="mt-3 text-base leading-relaxed text-slate-200/90">
              {content.subtitle}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {content.badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-100"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <aside className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 shadow-xl shadow-indigo-500/10 backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-teal-100">
                Snapshot
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-100">
                {isLoadingContent ? "Loading..." : "Live"}
              </span>
            </div>
            <ul className="space-y-2 text-sm text-slate-100/90">
              <li>
                <span className="text-slate-400">Location:</span>{" "}
                {content.location}
              </li>
              <li>
                <span className="text-slate-400">Availability:</span>{" "}
                {content.availability}
              </li>
            </ul>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-200">
                Highlights
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
            <p className="text-xs text-slate-400">
              The chat below is grounded in your{" "}
              <code className="rounded bg-slate-900 px-2 py-1 text-[11px] text-teal-200">
                content/profile.md
              </code>
              .
            </p>
          </aside>
        </header>

        <ChatPanel
          personaName={content.name}
          personaTitle={content.title}
          personaSubtitle={content.subtitle}
        />
      </div>
    </main>
  );
}

export default App;
