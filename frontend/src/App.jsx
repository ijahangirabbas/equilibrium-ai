import { useState } from "react";
import PromptInput from "./components/PromptInput.jsx";
import BalanceScale from "./components/BalanceScale.jsx";
import ContestantCard from "./components/ContestantCard.jsx";
import FinalAnswer from "./components/FinalAnswer.jsx";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE || "";

export default function App() {
  const [status, setStatus] = useState("idle"); // idle | weighing | settled | error
  const [contestants, setContestants] = useState({});
  const [finalAnswer, setFinalAnswer] = useState(null);
  const [evaluatorNotes, setEvaluatorNotes] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  async function handleSubmit(prompt) {
    setStatus("weighing");
    setFinalAnswer(null);
    setEvaluatorNotes(null);
    setErrorMessage(null);
    setContestants({
      openai: { loading: true },
      groq: { loading: true },
      gemini: { loading: true },
    });

    try {
      const res = await fetch(`${API_BASE}/api/equilibrium`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        if (!res.ok) {
          const rawText = await res.text().catch(() => "");
          throw new Error(rawText || `Server returned error status ${res.status}`);
        }
        throw new Error("Server returned an invalid response format.");
      }

      if (!res.ok) {
        setErrorMessage(data.error || "Something went wrong.");
        setStatus("error");
        return;
      }

      const next = {
        openai: { loading: false },
        groq: { loading: false },
        gemini: { loading: false },
      };

      data.contestantResponses.forEach((r) => {
        const key = r.model.split(":")[0];
        next[key] = { loading: false, text: r.text };
      });

      (data.failedModels || []).forEach((f) => {
        next[f.model] = { loading: false, error: f.error };
      });

      setContestants(next);
      setFinalAnswer(data.finalAnswer);
      setEvaluatorNotes(data.evaluatorNotes);
      setStatus("settled");
    } catch (err) {
      setErrorMessage(err.message);
      setStatus("error");
    }
  }

  const scaleStatus = status === "weighing" ? "weighing" : status === "settled" ? "settled" : "idle";

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Equilibrium AI</h1>
        <p className="app__subtitle">
          One question, three models, a single weighed answer.
        </p>
      </header>

      <BalanceScale status={scaleStatus} />

      <main className="app__main">
        <PromptInput onSubmit={handleSubmit} disabled={status === "weighing"} />

        {status !== "idle" && (
          <div className="app__contestants">
            {["openai", "groq", "gemini"].map((key) => (
              <ContestantCard
                key={key}
                modelKey={key}
                loading={contestants[key]?.loading}
                response={contestants[key]?.text}
                error={contestants[key]?.error}
              />
            ))}
          </div>
        )}

        {errorMessage && <p className="app__error">{errorMessage}</p>}

        <FinalAnswer answer={finalAnswer} notes={evaluatorNotes} />
      </main>
    </div>
  );
}
