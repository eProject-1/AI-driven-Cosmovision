import { useState } from "react";
import ChatWindow from "./ChatWindow";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="cosmo-chat-widget">
      {open && <ChatWindow onClose={() => setOpen(false)} />}

      <button
        type="button"
        className="cosmo-chat-toggle"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close chatbot" : "Open chatbot"}
      >
        {open ? "x" : "AI"}
      </button>
    </div>
  );
}
