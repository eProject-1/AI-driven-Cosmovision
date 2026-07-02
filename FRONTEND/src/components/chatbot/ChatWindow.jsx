import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getChatHistory, sendMessage } from "../../services/chatbot.api.js";
import { useAuth } from "../../context/AuthContext";
import ChatInput from "./ChatInput";
import MessageList from "./MessageList";

const STARTER_MESSAGES = [
  "What makes Mars special?",
  "When should I observe Orion?",
  "Explain meteor showers",
];

const CHAT_SESSION_STORAGE_KEY = "cosmovision_chat_session_id";

const getUserChatSessionKey = (user) => {
  const userKey = user?.id || user?.email || user?.username;
  return userKey ? `${CHAT_SESSION_STORAGE_KEY}:${userKey}` : CHAT_SESSION_STORAGE_KEY;
};

const welcomeMessage = {
  id: "welcome",
  role: "assistant",
  content: "Hi, I'm CosmoBot. Ask me about planets, constellations, or how to observe the night sky.",
};

export default function ChatWindow({ onClose }) {
  const { user, loading: authLoading } = useAuth();
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([welcomeMessage]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");

  const canChat = Boolean(user);
  const sessionStorageKey = useMemo(() => getUserChatSessionKey(user), [user]);

  useEffect(() => {
    if (!canChat) {
      setSessionId(null);
      setMessages([welcomeMessage]);
      setError("");
      return;
    }

    setSessionId(localStorage.getItem(sessionStorageKey));
    setMessages([welcomeMessage]);
    setError("");
  }, [canChat, sessionStorageKey]);

  useEffect(() => {
    if (!canChat || !sessionId) return;

    let alive = true;
    setHistoryLoading(true);
    getChatHistory(sessionId)
      .then((history) => {
        if (!alive || !history?.length) return;
        setMessages(
          history.map((message, index) => ({
            id: message.id || `${message.role}-${index}`,
            role: message.role,
            content: message.content,
          }))
        );
      })
      .catch((err) => {
        if (!alive) return;
        if ([403, 404].includes(err.response?.status)) {
          localStorage.removeItem(sessionStorageKey);
          setSessionId(null);
          setMessages([welcomeMessage]);
          setError("The previous chat session belongs to another account. I reset it, so you can send a new question.");
          return;
        }
        setError("Could not load chat history. You can still send a new question.");
      })
      .finally(() => {
        if (alive) setHistoryLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [canChat, sessionId, sessionStorageKey]);

  const statusText = useMemo(() => {
    if (authLoading) return "Checking your session";
    if (!canChat) return "Login required";
    if (historyLoading) return "Loading history";
    return "Online";
  }, [authLoading, canChat, historyLoading]);

  const handleSend = async (text) => {
    if (!text.trim() || loading || !canChat) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
    };
    setMessages((current) => [...current, userMessage]);
    setError("");
    setLoading(true);

    try {
      const result = await sendMessage(userMessage.content, sessionId);
      if (result.sessionId && result.sessionId !== sessionId) {
        localStorage.setItem(sessionStorageKey, result.sessionId);
        setSessionId(result.sessionId);
      }
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: result.reply,
        },
      ]);
    } catch (err) {
      if ([403, 404].includes(err.response?.status)) {
        localStorage.removeItem(sessionStorageKey);
        setSessionId(null);
        setError("The previous chat session belongs to another account. I reset it, please send your question again.");
      } else {
        setError(err.response?.data?.message || "Could not connect to the chatbot backend.");
      }
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: "I could not reach the backend yet. Please make sure the backend is running and you are logged in.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="cosmo-chat-window">
      <header className="cosmo-chat-header">
        <div>
          <p>CosmoBot</p>
          <span>{statusText}</span>
        </div>
        <button type="button" onClick={onClose} aria-label="Close chatbot">
          x
        </button>
      </header>

      {!canChat && !authLoading ? (
        <div className="cosmo-chat-login">
          <div className="cosmo-chat-orb">AI</div>
          <h3>Login to use CosmoBot</h3>
          <p>The chatbot route requires an authenticated account. Log in, then come back and ask CosmoBot anything about astronomy.</p>
          <Link to="/login">Login</Link>
        </div>
      ) : (
        <>
          <MessageList messages={messages} loading={loading || historyLoading} />
          {error && <div className="cosmo-chat-error">{error}</div>}
          <div className="cosmo-chat-starters">
            {STARTER_MESSAGES.map((starter) => (
              <button key={starter} type="button" onClick={() => handleSend(starter)} disabled={loading}>
                {starter}
              </button>
            ))}
          </div>
          <ChatInput onSend={handleSend} disabled={loading || historyLoading || !canChat} />
        </>
      )}
    </section>
  );
}
