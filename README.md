# Equilibrium AI

Send one prompt to OpenAI, Groq (Meta LLaMA), and Gemini in parallel, then have
Gemini act as a final evaluator that synthesizes the strongest possible answer from
all three — not just a copy of one model's response.

## How it works

1. The frontend sends your prompt to the backend at `POST /api/equilibrium`.
2. The backend fires the prompt at OpenAI, Groq (LLaMA), and Gemini simultaneously
   (`Promise.allSettled`, so one failing model doesn't block the others).
3. Whichever responses succeed are handed to a Gemini "evaluator" call, which
   is prompted to compare them, note disagreements, and write one polished
   final answer plus a short "Evaluator Notes" section.
4. The frontend shows the final answer prominently, with each model's raw
   response available in a collapsible card underneath.

## Project structure

```
equilibrium-ai/
├── backend/           Express API (Node)
│   ├── server.js       orchestrates the parallel calls + evaluation
│   └── services/
│       ├── openai.js
│       ├── groq.js
│       ├── gemini.js
│       └── evaluator.js
└── frontend/          React + Vite UI
    └── src/
        ├── App.jsx
        └── components/
            ├── PromptInput.jsx
            ├── BalanceScale.jsx   the "weighing" visual
            ├── ContestantCard.jsx
            └── FinalAnswer.jsx
```

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env and paste in your real API keys
npm run dev
```

Runs on `http://localhost:5001`.

You need API keys from:
- OpenAI — https://platform.openai.com/api-keys
- Groq — https://console.groq.com/keys
- Google AI Studio (Gemini) — https://aistudio.google.com/apikey

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # optional — only needed for production deploys
npm run dev
```

Runs on `http://localhost:5173` and proxies `/api` requests to the backend
during development (see `vite.config.js`).

## Notes on models

Default models are set in `backend/.env.example` and can be changed there:
- `OPENAI_MODEL` (default `gpt-4o`)
- `GROQ_MODEL` (default `llama-3.3-70b-versatile`) — Meta LLaMA served via Groq
- `GEMINI_MODEL` (default `gemini-2.0-flash`) — used for the "contestant" call
- `GEMINI_EVALUATOR_MODEL` (default `gemini-2.5-pro`) — used for the final
  synthesis, since evaluation benefits from a stronger model even if the
  contestant call uses a faster/cheaper one

Other Groq LLaMA variants you can swap in via `GROQ_MODEL`:
- `llama-3.1-8b-instant` — fastest, cheapest
- `llama3-70b-8192` — larger context window

Double-check current model names against each provider's docs before shipping —
provider lineups change.

## Extending it

- **Add a model**: create `services/yourmodel.js` following the same
  `{ model, text }` return shape, then add it to the `contestants` array in
  `server.js`.
- **Show which model "won" a section**: the evaluator prompt already tells
  Gemini not to name models in the final answer itself, but you could ask it
  to return structured JSON with per-paragraph attribution if you want that
  level of detail.
- **Rate limiting / caching**: not included — add before any public deploy so
  one user can't rack up API costs across all three providers per request.
