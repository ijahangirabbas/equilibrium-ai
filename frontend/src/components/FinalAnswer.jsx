import ReactMarkdown from "react-markdown";
import "./FinalAnswer.css";

export default function FinalAnswer({ answer, notes }) {
  if (!answer) return null;

  return (
    <div className="final-answer">
      <div className="final-answer__eyebrow">Equilibrium reached</div>
      <div className="final-answer__body">
        <ReactMarkdown>{answer}</ReactMarkdown>
      </div>
      {notes && (
        <details className="final-answer__notes">
          <summary>How this answer was weighed</summary>
          <ReactMarkdown>{notes}</ReactMarkdown>
        </details>
      )}
    </div>
  );
}
