import "./BalanceScale.css";

/**
 * status: "idle" | "weighing" | "settled"
 * A literal balance scale — three pans of unequal, restless weight
 * while models are responding, resolving to a single level beam once
 * the evaluator has produced the final synthesis.
 */
export default function BalanceScale({ status = "idle" }) {
  const beamClass =
    status === "weighing"
      ? "beam beam--weighing"
      : status === "settled"
      ? "beam beam--settled"
      : "beam";

  return (
    <div className={`scale scale--${status}`} role="img" aria-label="Balance scale representing model synthesis">
      <svg viewBox="0 0 320 160" className="scale__svg">
        {/* fulcrum post */}
        <line x1="160" y1="150" x2="160" y2="40" stroke="var(--border)" strokeWidth="4" strokeLinecap="round" />
        <circle cx="160" cy="36" r="6" fill="var(--accent-brass)" />

        {/* beam group rotates around the fulcrum */}
        <g className={beamClass} style={{ transformOrigin: "160px 36px" }}>
          <line x1="40" y1="36" x2="280" y2="36" stroke="var(--accent-brass)" strokeWidth="3" strokeLinecap="round" />
          {/* left pan (openai) */}
          <line x1="70" y1="36" x2="70" y2="70" stroke="var(--border)" strokeWidth="2" />
          <path d="M 50 70 Q 70 90 90 70" stroke="var(--text-muted)" strokeWidth="2" fill="none" />
          {/* center pan (groq, sits lower/closer) */}
          <line x1="160" y1="36" x2="160" y2="60" stroke="var(--border)" strokeWidth="2" />
          <path d="M 145 60 Q 160 76 175 60" stroke="var(--text-muted)" strokeWidth="2" fill="none" />
          {/* right pan (gemini) */}
          <line x1="250" y1="36" x2="250" y2="70" stroke="var(--border)" strokeWidth="2" />
          <path d="M 230 70 Q 250 90 270 70" stroke="var(--text-muted)" strokeWidth="2" fill="none" />
        </g>
      </svg>
      <div className="scale__caption">
        {status === "weighing" && "Weighing three answers…"}
        {status === "settled" && "Equilibrium reached"}
        {status === "idle" && "Ask something to begin"}
      </div>
    </div>
  );
}
