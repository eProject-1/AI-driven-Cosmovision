import { useState } from "react";

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    setValue("");
    onSend(text);
  };

  return (
    <form className="cosmo-chat-input" onSubmit={submit}>
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Ask about Mars, Orion, meteor showers..."
        disabled={disabled}
      />
      <button type="submit" disabled={disabled || !value.trim()}>
        Send
      </button>
    </form>
  );
}
