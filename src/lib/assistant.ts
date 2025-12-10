import type { ChatMessage } from "../types/chat";
import type { LanguageCode } from "../types/language";

const placeholderReply =
  "I'm ready to answer questions about you. Add your details to content/profile.json and content/projects.json, then wire up OpenAI chat completions to replace this placeholder.";

async function draftAssistantReply(
  history: ChatMessage[],
  language: LanguageCode
): Promise<string> {
  try {
    const response = await fetch("/api/assistant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ history, language }),
    });

    if (!response.ok) {
      throw new Error(`Chat request failed: ${response.status} ${response.statusText}`);
    }

    const data: { reply?: string } = await response.json();
    if (!data.reply) {
      throw new Error("Chat response missing assistant reply content");
    }

    return data.reply;
  } catch (error) {
    console.error("Assistant request failed, falling back to placeholder.", error);
    return placeholderReply;
  }
}

function createMessageId(prefix: string) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export { createMessageId, draftAssistantReply };
