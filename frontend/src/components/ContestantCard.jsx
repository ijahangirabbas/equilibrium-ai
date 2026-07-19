import { useState } from "react";
import ReactMarkdown from "react-markdown";
import "./ContestantCard.css";

const LABELS = {
  openai: "OpenAI",
  groq: "Groq (LLaMA)",
  gemini: "Gemini",
};

export default function ContestantCard({ modelKey, response, error, loading }) {
  const [expanded, setExpanded] = useState(false);
  const label = LABELS[modelKey] || modelKey;

  return (
    <div className={`contestant-card contestant-card--${modelKey}`}>
      <div className="contestant-card__header" onClick={() => setExpanded((v) => !v)}>
        <span className="contestant-card__dot" />
        <span className="contestant-card__label">{label}</span>
        <span className="contestant-card__status">
          {loading ? "thinking…" : error ? "failed" : "responded"}
        </span>
        {!loading && (
          <span className="contestant-card__chevron">{expanded ? "\u2212" : "+"}</span>
        )}
      </div>
      {expanded && !loading && (
        <div className="contestant-card__body">
          {error ? (
            <p className="contestant-card__error">{error}</p>
          ) : (
            <ReactMarkdown>{response}</ReactMarkdown>
          )}
        </div>
      )}
    </div>
  );
}
