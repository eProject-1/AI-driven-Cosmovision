export default function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`cosmo-message ${isUser ? "user" : "assistant"}`}>
      {!isUser && <div className="cosmo-avatar">AI</div>}
      <div className="cosmo-bubble">
        <p>{message.content}</p>
      </div>
    </div>
  );
}
