type MessageRole = "user" | "assistant";

type LinkPreview = {
  url: string;
  label?: string;
};

type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  links?: LinkPreview[];
};

export type { ChatMessage, LinkPreview, MessageRole };
