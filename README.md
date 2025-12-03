# Personal Chatbot (single page)

A single-page React app that answers questions about you. The answers should come from your own markdown profile and an OpenAI-powered backend.

## Project structure

- `content/profile.md` — the profile the chatbot should reference.
- `src/components/*` — chat UI pieces (panel, input, message bubble).
- `src/lib/assistant.ts` — placeholder for calling OpenAI.
- `src/types/chat.ts` — shared chat message types.
- `.env.example` — environment variables to copy to `.env.local`.

## Getting started

1) Install deps: `npm install`
2) Copy envs: `cp .env.example .env.local` and set `VITE_OPENAI_API_KEY`
3) Run locally: `npm run dev`
4) Build for deploy: `npm run build` (outputs to `dist`)

## Wiring OpenAI

Frontend is ready to collect a chat history; replace the placeholder in `src/lib/assistant.ts` with a call to your backend or serverless function. That endpoint should:

- Load `content/profile.md`
- Send the markdown and user question to OpenAI's chat completions API
- Return the assistant reply for the UI to display

Avoid exposing your API key in the browser; keep the call server-side.
