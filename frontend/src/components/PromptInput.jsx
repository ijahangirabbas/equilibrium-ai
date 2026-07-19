import { useState } from "react";
import "./PromptInput.css";

export default function PromptInput({ onSubmit, disabled }) {
  const [value, setValue] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSubmit(value.trim());
  }

  return (
    <form className="prompt-input" onSubmit={handleSubmit}>
      <textarea
        className="prompt-input__field"
        placeholder="Ask anything. Three models will answer — one equilibrium will be found."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        disabled={disabled}
      />
      <button className="prompt-input__submit" type="submit" disabled={disabled || !value.trim()}>
        {disabled ? "Weighing…" : "Find equilibrium"}
      </button>
    </form>
  );
}
