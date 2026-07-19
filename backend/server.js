import "dotenv/config";
import express from "express";
import cors from "cors";

import { queryOpenAI } from "./services/openai.js";
import { queryGroq } from "./services/groq.js";
import { queryGemini } from "./services/gemini.js";
import { evaluateResponses } from "./services/evaluator.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const PORT = process.env.PORT || 5001;

/**
 * POST /api/equilibrium
 * body: { prompt: string }
 *
 * Fires the prompt at all contestant models in parallel, tolerates
 * individual failures (e.g. a missing API key or a rate limit),
 * then sends whichever responses succeeded to the OpenAI evaluator
 * for synthesis.
 */
app.post("/api/equilibrium", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "A non-empty 'prompt' string is required" });
  }

  const contestants = [
    { name: "openai", fn: () => queryOpenAI(prompt) },
    { name: "groq", fn: () => queryGroq(prompt) },
    { name: "gemini", fn: () => queryGemini(prompt) },
  ];

  const settled = await Promise.allSettled(contestants.map((c) => c.fn()));

  const responses = [];
  const errors = [];

  settled.forEach((result, i) => {
    const name = contestants[i].name;
    if (result.status === "fulfilled") {
      responses.push(result.value);
    } else {
      errors.push({ model: name, error: result.reason?.message || String(result.reason) });
    }
  });

  if (responses.length === 0) {
    return res.status(502).json({
      error: "All contestant models failed",
      details: errors,
    });
  }

  try {
    const evaluation = await evaluateResponses(prompt, responses);

    res.json({
      prompt,
      finalAnswer: evaluation.finalAnswer,
      evaluatorNotes: evaluation.evaluatorNotes,
      evaluatorModel: evaluation.model,
      contestantResponses: responses,
      failedModels: errors,
    });
  } catch (err) {
    res.status(502).json({
      error: "Evaluation step failed",
      details: err.message,
      contestantResponses: responses,
      failedModels: errors,
    });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Equilibrium AI backend running on http://localhost:${PORT}`);
});

export default app;
