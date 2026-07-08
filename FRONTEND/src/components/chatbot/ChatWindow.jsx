import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { History, Loader2, MessageSquare, MessageSquarePlus, Trash2, X } from "lucide-react";
import {
  clearChatHistory,
  clearChatSessions,
  getChatHistory,
  getChatSessions,
  sendMessage,
} from "../../services/chatbot.api.js";
import { useAuth } from "../../context/authState";
import ChatInput from "./ChatInput";
import MessageList from "./MessageList";

const STARTER_MESSAGES = [
  "What makes Mars special?",
  "When should I observe Orion?",
  "Explain meteor showers",
];

const CHAT_SESSION_STORAGE_KEY = "cosmovision_chat_session_id";
const DELETE_ALL_ID = "all";

const getUserChatSessionKey = (user) => {
  const userKey = user?.id || user?.email || user?.username;
  return userKey ? `${CHAT_SESSION_STORAGE_KEY}:${userKey}` : CHAT_SESSION_STORAGE_KEY;
};

const welcomeMessage = {
  id: "welcome",
  role: "assistant",
  content: "Hi, I'm CosmoBot. Ask me about planets, constellations, or how to observe the night sky.",
};

const mapHistoryMessages = (history = []) => {
  if (!Array.isArray(history) || history.length === 0) return [welcomeMessage];

  return history.map((message, index) => ({
    id: message.id || `${message.role}-${index}`,
    role: message.role,
    content: message.content,
  }));
};

const formatSessionDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const getMessageCountLabel = (count = 0) => `${count} message${count === 1 ? "" : "s"}`;

export default function ChatWindow({ onClose }) {
  const { user, loading: authLoading } = useAuth();
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([welcomeMessage]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState(null);
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");

  const canChat = Boolean(user);
  const sessionStorageKey = useMemo(() => getUserChatSessionKey(user), [user]);

  const loadSessions = useCallback(async () => {
    if (!canChat) {
      setSessions([]);
      return;
    }

    setSessionsLoading(true);
    try {
      const data = await getChatSessions({ limit: 30 });
      setSessions(Array.isArray(data) ? data : []);
      setHistoryError("");
    } catch {
      setHistoryError("Could not load chat history list.");
    } finally {
      setSessionsLoading(false);
    }
  }, [canChat]);

  useEffect(() => {
    if (!canChat) {
      setSessionId(null);
      setMessages([welcomeMessage]);
      setSessions([]);
      setHistoryOpen(false);
      setError("");
      setHistoryError("");
      return;
    }

    setSessionId(localStorage.getItem(sessionStorageKey));
    setMessages([welcomeMessage]);
    setError("");
    setHistoryError("");
  }, [canChat, sessionStorageKey]);

  useEffect(() => {
    if (!canChat || !sessionId) return;

    let alive = true;
    setHistoryLoading(true);
    getChatHistory(sessionId)
      .then((history) => {
        if (!alive) return;
        setMessages(mapHistoryMessages(history));
      })
      .catch((err) => {
        if (!alive) return;
        if ([403, 404].includes(err.response?.status)) {
          localStorage.removeItem(sessionStorageKey);
          setSessionId(null);
          setMessages([welcomeMessage]);
          setHistoryError("The previous chat session could not be restored, so it was reset.");
          void loadSessions();
          return;
        }
        setHistoryError("Could not load chat history. You can still send a new question.");
      })
      .finally(() => {
        if (alive) setHistoryLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [canChat, loadSessions, sessionId, sessionStorageKey]);

  const statusText = useMemo(() => {
    if (authLoading) return "Checking your session";
    if (!canChat) return "Login required";
    if (historyLoading) return "Loading history";
    return "Online";
  }, [authLoading, canChat, historyLoading]);

  const handleNewChat = () => {
    localStorage.removeItem(sessionStorageKey);
    setSessionId(null);
    setMessages([welcomeMessage]);
    setHistoryOpen(false);
    setError("");
    setHistoryError("");
  };

  const handleSelectSession = (nextSessionId) => {
    if (!nextSessionId || deletingSessionId) return;
    localStorage.setItem(sessionStorageKey, nextSessionId);
    setSessionId(nextSessionId);
    setHistoryOpen(false);
    setError("");
    setHistoryError("");
  };

  const handleDeleteSession = async (targetSessionId) => {
    if (!targetSessionId || deletingSessionId) return;
    if (!window.confirm("Delete this chat history?")) return;

    setDeletingSessionId(targetSessionId);
    if (historyOpen) setHistoryError("");
    else setError("");
    try {
      await clearChatHistory(targetSessionId);
      setSessions((current) => current.filter((session) => session.id !== targetSessionId));
      if (targetSessionId === sessionId) {
        localStorage.removeItem(sessionStorageKey);
        setSessionId(null);
        setMessages([welcomeMessage]);
      }
    } catch (err) {
      const message = err.response?.data?.message || "Could not delete this chat history.";
      if (historyOpen) setHistoryError(message);
      else setError(message);
    } finally {
      setDeletingSessionId(null);
    }
  };

  const handleClearAllSessions = async () => {
    if (deletingSessionId || sessions.length === 0) return;
    if (!window.confirm("Delete all chat history?")) return;

    setDeletingSessionId(DELETE_ALL_ID);
    setHistoryError("");
    try {
      await clearChatSessions();
      localStorage.removeItem(sessionStorageKey);
      setSessionId(null);
      setMessages([welcomeMessage]);
      setSessions([]);
    } catch (err) {
      setHistoryError(err.response?.data?.message || "Could not delete chat history.");
    } finally {
      setDeletingSessionId(null);
    }
  };

  const handleSend = async (text) => {
    if (!text.trim() || loading || !canChat) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
    };
    setMessages((current) => [...current, userMessage]);
    setHistoryOpen(false);
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
      if (result.historyStatus && !result.historyStatus.saved) {
        setHistoryError(result.historyStatus.reason || "Chat history could not be saved right now.");
      } else {
        setHistoryError("");
      }
      if (result.historyStatus?.available !== false) void loadSessions();
    } catch (err) {
      if ([403, 404].includes(err.response?.status)) {
        localStorage.removeItem(sessionStorageKey);
        setSessionId(null);
        setError("The previous chat session belongs to another account. I reset it, please send your question again.");
        void loadSessions();
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

  const renderHistoryPanel = () => (
    <div className="cosmo-chat-history-panel">
      <div className="cosmo-chat-history-head">
        <div>
          <p>History</p>
          <span>{sessions.length ? getMessageCountLabel(sessions.reduce((total, item) => total + (item.messageCount || 0), 0)) : "No saved chats"}</span>
        </div>
        <button
          type="button"
          className="cosmo-chat-clear-all"
          onClick={handleClearAllSessions}
          disabled={sessions.length === 0 || Boolean(deletingSessionId)}
        >
          {deletingSessionId === DELETE_ALL_ID ? <Loader2 size={14} className="cosmo-spin" /> : <Trash2 size={14} />}
          Clear all
        </button>
      </div>

      {historyError && <div className="cosmo-chat-error">{historyError}</div>}

      {sessionsLoading ? (
        <div className="cosmo-chat-history-empty">
          <Loader2 size={18} className="cosmo-spin" />
          <span>Loading history</span>
        </div>
      ) : sessions.length ? (
        <div className="cosmo-chat-session-list">
          {sessions.map((session) => (
            <div key={session.id} className={`cosmo-chat-session ${session.id === sessionId ? "active" : ""}`}>
              <button type="button" className="cosmo-chat-session-main" onClick={() => handleSelectSession(session.id)}>
                <span className="cosmo-chat-session-icon">
                  <MessageSquare size={15} />
                </span>
                <span className="cosmo-chat-session-copy">
                  <span className="cosmo-chat-session-title">{session.title || "New Conversation"}</span>
                  <span className="cosmo-chat-session-meta">
                    {getMessageCountLabel(session.messageCount || 0)}
                    {session.updatedAt ? ` - ${formatSessionDate(session.updatedAt)}` : ""}
                  </span>
                  <span className="cosmo-chat-session-preview">{session.preview || "No messages yet"}</span>
                </span>
              </button>
              <button
                type="button"
                className="cosmo-chat-session-delete"
                onClick={() => handleDeleteSession(session.id)}
                disabled={Boolean(deletingSessionId)}
                aria-label={`Delete ${session.title || "chat history"}`}
                title="Delete chat history"
              >
                {deletingSessionId === session.id ? <Loader2 size={15} className="cosmo-spin" /> : <Trash2 size={15} />}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="cosmo-chat-history-empty">
          <History size={18} />
          <span>No chat history yet</span>
        </div>
      )}
    </div>
  );

  return (
    <section className="cosmo-chat-window">
      <header className="cosmo-chat-header">
        <div className="cosmo-chat-title">
          <p>CosmoBot</p>
          <span>{statusText}</span>
        </div>
        <div className="cosmo-chat-actions">
          <button type="button" onClick={handleNewChat} aria-label="Start new chat" title="Start new chat" disabled={!canChat || loading}>
            <MessageSquarePlus size={17} />
          </button>
          <button
            type="button"
            onClick={() => {
              setHistoryOpen((open) => !open);
              if (!historyOpen) void loadSessions();
            }}
            aria-label="View chat history"
            title="View chat history"
            aria-pressed={historyOpen}
            disabled={!canChat}
          >
            <History size={17} />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteSession(sessionId)}
            aria-label="Delete current chat"
            title="Delete current chat"
            disabled={!canChat || !sessionId || Boolean(deletingSessionId)}
          >
            {deletingSessionId === sessionId ? <Loader2 size={17} className="cosmo-spin" /> : <Trash2 size={17} />}
          </button>
          <button type="button" onClick={onClose} aria-label="Close chatbot" title="Close chatbot">
            <X size={18} />
          </button>
        </div>
      </header>

      {!canChat && !authLoading ? (
        <div className="cosmo-chat-login">
          <div className="cosmo-chat-orb">AI</div>
          <h3>Login to use CosmoBot</h3>
          <p>The chatbot route requires an authenticated account. Log in, then come back and ask CosmoBot anything about astronomy.</p>
          <Link to="/login">Login</Link>
        </div>
      ) : historyOpen ? (
        renderHistoryPanel()
      ) : (
        <>
          <MessageList messages={messages} loading={loading || historyLoading} />
          {error && <div className="cosmo-chat-error">{error}</div>}
          <div className="cosmo-chat-starters">
            {STARTER_MESSAGES.map((starter) => (
              <button key={starter} type="button" onClick={() => handleSend(starter)} disabled={loading || historyLoading}>
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
