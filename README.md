# Equilibrium AI

<img src="frontend/public/favicon.jpg" width="100" height="100" align="right" alt="Equilibrium AI Logo" />

Equilibrium AI is a web application that queries multiple large language models in parallel, weighs their responses, and uses an evaluator model to synthesize a single balanced final answer.

## How the Project Works
1. **User Input**: The user enters a prompt in the web interface.
2. **Parallel Dispatching**: The backend receives the prompt and dispatches it concurrently to three separate contestant models using `Promise.allSettled` (so rate limits or outages on one provider don't block the others).
3. **Consolidation**: The backend compiles all successful responses and feeds them to the evaluator model.
4. **Synthesis**: The evaluator analyzes the responses, resolves discrepancies, and outputs a single cohesive answer along with evaluation notes.
5. **Rendering**: The frontend displays the synthesized response prominently, with the individual models' raw answers accessible underneath.

## Interface Type
This is a **UI-based web application**:
- **Frontend**: A React application built with Vite and vanilla CSS featuring a dynamic balance scale visualization.
- **Backend**: An Express.js Node API that orchestrates model calls and synthesis, designed to be deployed on Vercel as serverless functions.

## Models and Providers Used
*   **OpenAI API (via Groq)**: `llama-3.3-70b-versatile` (or customizable via `OPENAI_MODEL` environment variable)
*   **Groq API**: `llama-3.3-70b-versatile` (or customizable via `GROQ_MODEL`)
*   **Google Gemini API**: `gemini-3.1-flash-lite` (or customizable via `GEMINI_MODEL`)
*   **Evaluator Model (OpenAI via Groq)**: `openai/gpt-oss-120b` (or customizable via `OPENAI_EVALUATOR_MODEL`)

## How the Self-Consistency Flow is Implemented
The self-consistency / evaluation flow is orchestrated in [evaluator.js](file:///c:/Users/User/Downloads/equilibrium-ai/equilibrium-ai/backend/services/evaluator.js):
1. **Prompt Compilation**: The system constructs an evaluation prompt containing the user's original question alongside the numbered responses from all successfully queried contestant models.
2. **System Prompt Rules**: The evaluator is guided by a system prompt to:
   - Weigh and synthesize the strongest points and facts from each response.
   - Resolve disagreements using its internal knowledge base.
   - Output only clean, direct text (no markdown tables, converting any tabular data into clean list items or bullet points).
   - Omit meta-commentary or model attributions in the final answer itself.
   - Append an **Evaluator Notes** section summarizing strengths and differences between the models.
3. **Extraction**: The backend defensively splits the evaluator response into the **Final Answer** and **Evaluator Notes** using regular expressions and serves it back to the UI.
