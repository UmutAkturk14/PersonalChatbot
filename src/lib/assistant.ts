import type { ChatMessage } from "../types/chat";

const placeholderReply =
  "I'm ready to answer questions about you. Add your profile to content/profile.md and wire up OpenAI chat completions to replace this placeholder.";

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
const baseUrl = (import.meta.env.VITE_OPENAI_BASE_URL || "https://api.openai.com/v1").replace(
  /\/$/,
  "",
);
const model = import.meta.env.VITE_OPENAI_MODEL || "gpt-4o-mini";
const profileUrl = new URL("../../content/profile.md", import.meta.url).href;
const projectsUrl = new URL("../../content/projects.md", import.meta.url).href;
let cachedProfile: string | null = null;
let cachedProjects: string | null = null;

async function loadProfileMarkdown(): Promise<string> {
  if (cachedProfile) return cachedProfile;

  const res = await fetch(profileUrl);
  if (!res.ok) {
    throw new Error(`Unable to load profile markdown: ${res.statusText}`);
  }

  cachedProfile = await res.text();
  return cachedProfile;
}

async function loadProjectsMarkdown(): Promise<string> {
  if (cachedProjects) return cachedProjects;

  try {
    const res = await fetch(projectsUrl);
    if (!res.ok) throw new Error(res.statusText);
    cachedProjects = await res.text();
  } catch (error) {
    console.warn("Unable to load projects.md; continuing without projects context.", error);
    cachedProjects = "";
  }

  return cachedProjects;
}

async function draftAssistantReply(
  history: ChatMessage[],
): Promise<string> {
  const hasApiKey = Boolean(apiKey);

  if (!hasApiKey) {
    return placeholderReply;
  }

  const profile = await loadProfileMarkdown();
  const projects = await loadProjectsMarkdown();

  const openAiMessages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [
    {
      role: "system",
      content: `You are a personal chatbot that answers questions using the user's profile markdown and projects.\nOnly answer questions about the person in the profile; if asked about anything else, politely decline and suggest topics like their experience, skills, or projects (e.g., “I can only reply to questions about the person here, like their experience or projects.”).\nUse ATS-friendly language and the STAR lens (Situation, Task, Action, Result) to structure responses, but do not make everything a bullet list. Prefer short paragraphs for context and insert bullet points only when they improve clarity for actions, results, or takeaways. Bold or underline key phrases sparingly for emphasis.\n\nProfile:\n${profile}\n\nProjects:\n${projects || "No projects provided."}`,
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
    throw new Error(`Chat request failed: ${response.status} ${response.statusText}`);
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
