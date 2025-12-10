# Personal Chatbot

A single-page React 19 + Vite app that answers questions about you. The chat is grounded in your own JSON + Markdown content and served by a Vercel function that calls OpenAI.

## Features

- AI answers via `api/assistant.ts` (OpenAI, GPT-4o-mini by default) with graceful fallback if the call fails.
- Data-driven persona: hero content from `content/content-*/content.json`, structured profile from `profile.json`, and project blurbs from `projects.json` (English + German, with fallback).
- Persistent language switcher (en/de) and loader for first paint to avoid layout flicker.
- Safe rich-text rendering for bullets/links and a simple typing indicator in the chat UI.
- Text input out of the box; if you want speech recognition, wire the browser SpeechRecognition API into `src/components/ChatInput.tsx` and submit the recognized text through the existing handler.
- Env-driven configuration for API key, base URL, and model so you can point at proxies or Azure OpenAI.

## Project structure

- `src/App.tsx` — page layout, language selection, and content loading.
- `src/components/*` — chat UI pieces (panel, input, message bubble).
- `src/lib/assistant.ts` — frontend helper that posts chat history to `/api/assistant`.
- `api/assistant.ts` — Vercel serverless function that injects your profile/projects into the OpenAI chat request.
- `content/content-en` and `content/content-de` — persona data (`content.json`, `profile.json`, `projects.json`).
- `.env.example` — environment variables copied to `.env.local`.

## Getting started

1. Install deps: `npm install`
2. Copy envs: `cp .env.example .env.local` and set `OPENAI_API_KEY` (optionally override `OPENAI_BASE_URL` and `OPENAI_MODEL`)
3. Run the UI: `npm run dev` (Vite on http://localhost:8080). Without the API running you’ll see the fallback reply.
4. Run the API locally: install the Vercel CLI and run `vercel dev` to serve `/api/assistant` alongside the app, or deploy to Vercel to get the function automatically.
5. Build for deploy: `npm run build` (outputs to `dist`).

## Feed your own data

- Update `content/content-en/content.json` (and `content/content-de/content.json`) for the hero/name/title/badges shown above the chat.
- Replace `content/content-en/profile.json` with your own structured resume/profile data; add a German version in `content/content-de/profile.json` or the app will fall back to English.
- Edit `content/content-en/projects.json` (and `content/content-de/projects.json`) with structured project entries; missing files fall back to English.
- Supported languages are defined in `src/types/language.ts`; to add more, extend that file and the `contentUrls` map in `src/App.tsx` and mirror the content folder structure.

## Using the chat

- Pick a language from the selector (stored for next visits).
- Ask questions about the person; press Enter or click Send.
- Answers are grounded in your JSON/Markdown data. Off-topic questions are politely declined and redirected to the profile.
