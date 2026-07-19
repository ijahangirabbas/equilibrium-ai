const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Sends a prompt to Groq (Meta LLaMA) and returns the plain text response.
 * Groq exposes an OpenAI-compatible endpoint, so the request/response shape
 * is identical to openai.js — only the URL, key, and model differ.
 * Throws a descriptive error if the call fails so the orchestrator
 * can catch it and continue with the other models.
 */
export async function queryGroq(prompt) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");

  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq returned an empty response");

  return { model: `groq:${model}`, text };
}
