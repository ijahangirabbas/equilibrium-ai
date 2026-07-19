import { queryOpenAI } from "./openai.js";

const SYSTEM_PROMPT = `[SYSTEM_ROLE]
Final Evaluator (Equilibrium AI)

[ALGORITHM_STEPS]
1. Read all contestant responses.
2. Weigh and synthesize the strongest points, facts, and structure from each.
3. Resolve any disagreements using your internal knowledge base.
4. Output a single final response directly answering the original user prompt.
5. DO NOT output meta-commentary, and do not reference model names or "Response X" in the final answer itself.
6. DO NOT use markdown tables in the final answer under any circumstances. If the contestants use tables, convert them to clean list items, bullet points, or bold headers with simple text blocks instead.
7. Create an "Evaluator Notes" section at the end referencing models by name.

[REQUIRED_OUTPUT_FORMAT]
## Final Answer
<synthesized answer text here>

## Evaluator Notes
<bullet points summarizing strengths/differences here>`;

/**
 * Builds the evaluator prompt: shows the original question plus every
 * successful contestant response (labeled, order-randomized-by-caller
 * if you want to avoid position bias), and asks OpenAI to synthesize
 * the strongest possible final answer rather than pick one verbatim.
 */
function buildEvaluatorPrompt(originalPrompt, responses) {
  const responseBlocks = responses
    .map(
      (r, i) =>
        `--- Response ${i + 1} (source: ${r.model}) ---\n${r.text}`
    )
    .join("\n\n");

  return `${SYSTEM_PROMPT}

[INPUTS]
- Original User Prompt: "${originalPrompt}"
- Contestant Responses to Weigh:
${responseBlocks}`;
}

/**
 * Runs the evaluation step. Expects `responses` to be an array of
 * { model, text } objects from the successful contestant calls.
 */
export async function evaluateResponses(originalPrompt, responses) {
  if (!responses.length) {
    throw new Error("No successful model responses to evaluate");
  }

  const evaluatorModel =
    process.env.OPENAI_EVALUATOR_MODEL ||
    process.env.OPENAI_MODEL ||
    "openai/gpt-oss-120b";

  const evaluatorApiKey = process.env.EVALUATOR_API_KEY;

  const prompt = buildEvaluatorPrompt(originalPrompt, responses);
  const result = await queryOpenAI(prompt, evaluatorModel, evaluatorApiKey);

  // Normalize non-standard unicode spaces (e.g. narrow non-breaking space U+202F)
  // to regular spaces (U+0020) so it renders correctly on all clients.
  const cleanText = result.text.replace(/[\u202F\u00A0\u2000-\u200B]/g, " ");

  // Split out the "Final Answer" and "Evaluator Notes" sections defensively.
  // Supports case-insensitive matches, different heading levels (#, ##, ###), and spacing variations.
  const match = cleanText.match(
    /(?:^|\n)#+\s*Final\s*Answer\s*\n+([\s\S]*?)(?:\n#+\s*Evaluator\s*Notes\s*\n+([\s\S]*)|$)/i
  );

  let finalAnswer = "";
  let evaluatorNotes = "";

  if (match) {
    finalAnswer = match[1].trim();
    evaluatorNotes = match[2] ? match[2].trim() : "";
  } else {
    // Fallback: If headings don't match, strip common headers manually
    // to present clean normal text to the user.
    finalAnswer = cleanText
      .replace(/#+\s*Final\s*Answer/gi, "")
      .replace(/#+\s*Evaluator\s*Notes[\s\S]*/gi, "")
      .trim();
  }

  return {
    model: result.model,
    rawText: result.text,
    finalAnswer: finalAnswer || cleanText.trim(),
    evaluatorNotes: evaluatorNotes,
  };
}
