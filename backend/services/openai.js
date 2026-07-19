const OPENAI_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Sends a prompt to OpenAI (redirected to Groq GPT-OSS) and returns the plain text response.
 * Throws a descriptive error if the call fails, so the orchestrator
 * can catch it and continue with the other models.
 */
export async function queryOpenAI(prompt, modelOverride, apiKeyOverride) {
  const apiKey = apiKeyOverride || process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY (or EVALUATOR_API_KEY) is not set");

  const model =
    modelOverride || process.env.OPENAI_MODEL || "llama-3.3-70b-versatile";

  const response = await fetch(OPENAI_URL, {
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
    throw new Error(`OpenAI API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenAI returned an empty response");

  return { model: `openai:${model}`, text };
}
