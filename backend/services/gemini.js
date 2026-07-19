/**
 * Sends a prompt to Gemini and returns the plain text response.
 * Accepts an optional modelOverride so the evaluator can use a
 * different (stronger) model than the contestant call.
 */
export async function queryGemini(prompt, modelOverride) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const model = modelOverride || process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 2048,   // ensure evaluator never gets truncated
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = await response.json();

  // Gemini can block a response via safety filters without a non-OK status.
  // Check promptFeedback / finishReason before trying to read content.
  const candidate = data?.candidates?.[0];
  const finishReason = candidate?.finishReason;
  if (finishReason && finishReason !== "STOP" && finishReason !== "MAX_TOKENS") {
    throw new Error(`Gemini blocked the response (finishReason: ${finishReason})`);
  }

  const text = candidate?.content?.parts?.map((p) => p.text).join("\n");
  if (!text) throw new Error("Gemini returned an empty response");

  return { model: `gemini:${model}`, text };
}
