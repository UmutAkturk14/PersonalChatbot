import type { ChatMessage } from "../types/chat";
import type { LanguageCode } from "../types/language";

const placeholderReply =
  "I'm ready to answer questions about you. Add your profile to content/profile.md and wire up OpenAI chat completions to replace this placeholder.";

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
const baseUrl = (
  import.meta.env.VITE_OPENAI_BASE_URL || "https://api.openai.com/v1"
).replace(/\/$/, "");
const model = import.meta.env.VITE_OPENAI_MODEL || "gpt-4o-mini";
const profileUrls: Record<LanguageCode, string> = {
  en: new URL("../../content/content-en/profile.md", import.meta.url).href,
  de: new URL("../../content/content-de/profile.md", import.meta.url).href,
};
const projectsUrls: Record<LanguageCode, string> = {
  en: new URL("../../content/content-en/projects.md", import.meta.url).href,
  de: new URL("../../content/content-de/projects.md", import.meta.url).href,
};
const cachedProfile: Partial<Record<LanguageCode, string>> = {};
const cachedProjects: Partial<Record<LanguageCode, string>> = {};

async function loadProfileMarkdown(language: LanguageCode): Promise<string> {
  if (cachedProfile[language]) return cachedProfile[language] as string;

  const url = profileUrls[language] || profileUrls.en;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.statusText);
    cachedProfile[language] = await res.text();
    return cachedProfile[language] as string;
  } catch (error) {
    if (language !== "en") {
      console.warn(
        "Profile fetch failed for language, falling back to en.",
        error
      );
      return loadProfileMarkdown("en");
    }
    throw new Error("Unable to load profile markdown");
  }
}

async function loadProjectsMarkdown(language: LanguageCode): Promise<string> {
  if (cachedProjects[language]) return cachedProjects[language] as string;

  const url = projectsUrls[language] || projectsUrls.en;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.statusText);
    cachedProjects[language] = await res.text();
  } catch (error) {
    if (language !== "en") {
      console.warn(
        "Projects fetch failed for language, falling back to en.",
        error
      );
      return loadProjectsMarkdown("en");
    }
    console.warn(
      "Unable to load projects.md; continuing without projects context.",
      error
    );
    cachedProjects[language] = "";
  }

  return cachedProjects[language] as string;
}

async function draftAssistantReply(
  history: ChatMessage[],
  language: LanguageCode
): Promise<string> {
  const hasApiKey = Boolean(apiKey);

  if (!hasApiKey) {
    return placeholderReply;
  }

  const profile = await loadProfileMarkdown(language);
  const projects = await loadProjectsMarkdown(language);
  const languageName = language === "de" ? "German" : "English";

  const openAiMessages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [
    {
      role: "system",
      content: `You are a personal chatbot that answers questions using the user's profile markdown and projects.\nOnly answer questions about the person in the profile; if asked about anything else, politely decline and suggest topics like their experience, skills, or projects (e.g., “I can only reply to questions about the person here, like their experience or projects.”).\nUse ATS-friendly language and the STAR lens (Situation, Task, Action, Result) to structure responses, but do not make everything a bullet list. Prefer short paragraphs for context and insert bullet points only when they improve clarity for actions, results, or takeaways. Bold or underline key phrases sparingly for emphasis.\nAnswer in an enthusiastic and respective tone, don't use words that might hint at seniority\nRespond in ${languageName}.\n\nProfile:\n${profile}\n\nProjects:\n${projects || "No projects provided."}`,
    },
    ...history.map(({ role, content }) => ({ role, content })),
  ];

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: openAiMessages,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Chat request failed: ${response.status} ${response.statusText}`
    );
  }

  const data: {
    choices?: Array<{ message?: { content?: string } }>;
  } = await response.json();

  const reply = data.choices?.[0]?.message?.content?.trim();

  if (!reply) {
    throw new Error("Chat response missing assistant reply content");
  }

  return reply;
}

function createMessageId(prefix: string) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export { createMessageId, draftAssistantReply };
