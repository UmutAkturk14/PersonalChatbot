import { Readable } from "node:stream";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { config as loadEnv } from "dotenv";

// Ensure local env vars are loaded in `vercel dev` or other local runs.
loadEnv({ path: ".env.local" });
loadEnv();

type LanguageCode = "en" | "de";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const apiKey = process.env.OPENAI_API_KEY;
const baseUrl = (
  process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
).replace(/\/$/, "");
const model = process.env.OPENAI_MODEL || "gpt-5.1";

const profileFile = path.join(
  process.cwd(),
  "content",
  "content-en",
  "profile.json"
);

const projectsFile = path.join(
  process.cwd(),
  "content",
  "content-en",
  "projects.json"
);

async function loadFile(filePath: string) {
  return readFile(filePath, "utf8");
}

async function loadProfile(): Promise<string> {
  try {
    const file = await loadFile(profileFile);
    const parsed = JSON.parse(file);
    return JSON.stringify(parsed, null, 2);
  } catch {
    throw new Error("Unable to load profile.json");
  }
}

async function loadProjects(): Promise<string> {
  try {
    const file = await loadFile(projectsFile);
    const parsed = JSON.parse(file);
    return JSON.stringify(parsed, null, 2);
  } catch (error) {
    console.warn(
      "Unable to load projects.json; continuing without projects context.",
      error
    );
    return "[]";
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!apiKey) {
    res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    return;
  }

  const language = (req.body?.language as LanguageCode) || "en";
  const history = (req.body?.history || req.body?.messages) as
    | ChatMessage[]
    | undefined;
  const stream = Boolean(req.body?.stream);

  if (!history || !Array.isArray(history)) {
    res.status(400).json({ error: "history (array of messages) is required" });
    return;
  }

  const profile = await loadProfile();
  const projects = await loadProjects();
  const languageName = language === "de" ? "German" : "English";

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a personal chatbot that answers questions using the user's profile JSON and projects.\nIf the question is about the person (even implicitly, e.g., “Are they a great developer?”), answer using the profile, projects, and reasonable inference. If the question is clearly unrelated to the person (e.g., “How do nuclear reactors work?”), politely decline and steer back to topics like their experience, skills, or projects (e.g., “I can only reply to questions about this person—ask about their experience or projects.”).\nWhen a skill/tool is not listed, say so clearly but end on a constructive note by linking nearby strengths and proven learning ability (e.g., transferable languages, frameworks, or fast ramp-ups), without inventing experience.\nAvoid guessing seniority labels (beginner/intermediate/advanced) unless the profile states them explicitly. Instead, describe capability with evidence: years, shipped features, responsibilities, or adjacent tools.\nTreat roles with an end date before today as past roles; do not describe them as current. If no current role is listed, state that they are currently not employed and highlight availability for new roles. When asked what they are “currently working on,” prioritize current projects, recent focus areas, and time use; if no current role exists, summarize recent projects/skills and availability instead of implying current employment.\nWhen mentioning a project, include the provided repo/live links with descriptive anchor text that includes the project name; never use generic anchors like “here” or “this link.”\nUse ATS-friendly language and the STAR lens (Situation, Task, Action, Result) to structure responses, but do not make everything a bullet list. Prefer short paragraphs for context and insert bullet points only when they improve clarity for actions, results, or takeaways. Bold or underline key phrases sparingly for emphasis.\nAnswer in ${languageName}.\n\nProfile JSON:\n${profile}\n\nProjects:\n${projects || "No projects provided."}`,
    },
    ...history,
  ];

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages,
        stream,
      }),
    });
  } catch (error) {
    console.error("OpenAI request failed to send:", error);
    res
      .status(500)
      .json({ error: "Failed to reach OpenAI", details: String(error) });
    return;
  }

  if (!response.ok) {
    const errorText = await response
      .text()
      .catch(() => "Unable to read error response from OpenAI");
    console.error(
      "OpenAI error response:",
      response.status,
      response.statusText,
      errorText
    );
    res.status(response.status).json({
      error: `Chat request failed: ${response.status} ${response.statusText}`,
      details: errorText?.slice(0, 800),
    });
    return;
  }

  if (stream) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const readable = Readable.fromWeb(
      response.body as unknown as import("stream/web").ReadableStream
    );
    readable.on("data", (chunk) => res.write(chunk));
    readable.on("end", () => res.end());
    readable.on("error", (error) => {
      console.error("Stream error:", error);
      if (res.headersSent) {
        res.end();
      } else {
        res.status(500).json({ error: "Stream error" });
      }
    });
    return;
  }

  const data: {
    choices?: Array<{ message?: { content?: string } }>;
  } = await response.json();

  const reply = data.choices?.[0]?.message?.content?.trim();

  if (!reply) {
    res
      .status(500)
      .json({ error: "Chat response missing assistant reply content" });
    return;
  }

  res.status(200).json({ reply });
}
