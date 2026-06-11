import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

export default function MessageList({ messages, loading }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="cosmo-chat-messages">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {loading && (
        <div className="cosmo-message assistant">
          <div className="cosmo-bubble typing">
            <span />
            <span />
            <span />
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
