import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "../components/lovable/PageShell";
import { SectionPanel } from "../components/lovable/Framing";
import { History, Loader2, MessageSquare, MessageSquarePlus, SendHorizontal, Trash2 } from "lucide-react";
import { useAuth } from "../context/authState";
import {
  clearChatHistory,
  clearChatSessions,
  getChatHistory,
  getChatSessions,
  sendMessage,
} from "../services/chatbot.api";

const CHAT_SESSION_STORAGE_KEY = "cosmovision_chat_session_id";
const LEGACY_ASSISTANT_SESSION_STORAGE_KEY = "cosmovision_assistant_session_id";
const DELETE_ALL_ID = "all";

const getUserSessionKey = (baseKey, user) => {
  const userKey = user?.id || user?.email || user?.username;
  return userKey ? `${baseKey}:${userKey}` : baseKey;
};

const welcomeMessage = {
  id: "welcome",
  role: "assistant",
  text: "Hi, I'm NOVA - your astronomy companion. Ask me anything about planets, stars, and the universe.",
};

const mapHistoryMessages = (history = []) => {
  if (!Array.isArray(history) || history.length === 0) return [welcomeMessage];

  return history.map((message, index) => ({
    id: message.id || `${message.role}-${index}`,
    role: message.role,
    text: message.content,
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

export default function LovableAssistant() {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState([welcomeMessage]);
  const [sessions, setSessions] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState(null);
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");

  const canChat = Boolean(user);
  const sessionStorageKey = useMemo(() => getUserSessionKey(CHAT_SESSION_STORAGE_KEY, user), [user]);
  const legacySessionStorageKey = useMemo(() => getUserSessionKey(LEGACY_ASSISTANT_SESSION_STORAGE_KEY, user), [user]);

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

    const savedSessionId = localStorage.getItem(sessionStorageKey) || localStorage.getItem(legacySessionStorageKey);
    if (savedSessionId) localStorage.setItem(sessionStorageKey, savedSessionId);
    setSessionId(savedSessionId);
    setMessages([welcomeMessage]);
    setError("");
    setHistoryError("");
  }, [canChat, legacySessionStorageKey, sessionStorageKey]);

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
          localStorage.removeItem(legacySessionStorageKey);
          setSessionId(null);
          setMessages([welcomeMessage]);
          setHistoryError("This chat session could not be restored, so it was reset.");
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
  }, [canChat, legacySessionStorageKey, loadSessions, sessionId, sessionStorageKey]);

  const statusText = useMemo(() => {
    if (authLoading) return "Checking your session";
    if (!canChat) return "Login required";
    if (historyLoading) return "Loading history";
    return "Online";
  }, [authLoading, canChat, historyLoading]);

  const handleNewChat = () => {
    localStorage.removeItem(sessionStorageKey);
    localStorage.removeItem(legacySessionStorageKey);
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
        localStorage.removeItem(legacySessionStorageKey);
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
      localStorage.removeItem(legacySessionStorageKey);
      setSessionId(null);
      setMessages([welcomeMessage]);
      setSessions([]);
    } catch (err) {
      setHistoryError(err.response?.data?.message || "Could not delete chat history.");
    } finally {
      setDeletingSessionId(null);
    }
  };

  const send = async (text) => {
    const value = (text ?? input).trim();
    if (!value || loading || !canChat) return;

    setInput("");
    setError("");
    setHistoryOpen(false);
    setLoading(true);
    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: "user", text: value }]);

    try {
      const result = await sendMessage(value, sessionId);
      if (result.sessionId && result.sessionId !== sessionId) {
        localStorage.setItem(sessionStorageKey, result.sessionId);
        setSessionId(result.sessionId);
      }
      setMessages((current) => [...current, { id: `assistant-${Date.now()}`, role: "assistant", text: result.reply }]);
      if (result.historyStatus && !result.historyStatus.saved) {
        setHistoryError(result.historyStatus.reason || "Chat history could not be saved right now.");
      } else {
        setHistoryError("");
      }
      if (result.historyStatus?.available !== false) void loadSessions();
    } catch (err) {
      if ([403, 404].includes(err.response?.status)) {
        localStorage.removeItem(sessionStorageKey);
        localStorage.removeItem(legacySessionStorageKey);
        setSessionId(null);
        setError("This chat session belongs to another account. I reset the session, please send your question again.");
        void loadSessions();
      } else {
        setError(err.response?.data?.message || "Could not connect to chatbot backend.");
      }
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          text: "I could not reach the backend yet. Please make sure the backend is running and you are logged in.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = ["Tell me about Jupiter", "How big is Saturn?", "What is a black hole?"];

  const renderHistoryPanel = () => (
    <div className="flex-1 overflow-y-auto p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-sm font-semibold text-foreground">History</p>
          <span className="text-xs font-light text-foreground/45">
            {sessions.length ? getMessageCountLabel(sessions.reduce((total, item) => total + (item.messageCount || 0), 0)) : "No saved chats"}
          </span>
        </div>
        <button
          type="button"
          onClick={handleClearAllSessions}
          disabled={sessions.length === 0 || Boolean(deletingSessionId)}
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-red-300/20 bg-red-950/20 px-3 text-xs font-medium text-red-100/80 transition hover:bg-red-950/35 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {deletingSessionId === DELETE_ALL_ID ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Clear all
        </button>
      </div>

      {historyError && (
        <div className="mb-4 rounded-xl border border-red-300/20 bg-red-950/20 p-3 text-sm font-light text-red-100/80">
          {historyError}
        </div>
      )}

      {sessionsLoading ? (
        <div className="grid h-full place-content-center justify-items-center gap-3 text-sm font-light text-foreground/55">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading history</span>
        </div>
      ) : sessions.length ? (
        <div className="grid gap-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`group grid grid-cols-[minmax(0,1fr)_2.25rem] items-center rounded-xl transition ${
                session.id === sessionId ? "bg-sky-400/10" : "hover:bg-slate-800/45"
              }`}
            >
              <button
                type="button"
                onClick={() => handleSelectSession(session.id)}
                className={`flex min-w-0 items-start gap-3 rounded-xl border px-3 py-3 text-left transition ${
                  session.id === sessionId
                    ? "border-sky-300/30"
                    : "border-transparent hover:border-sky-300/20"
                }`}
              >
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-foreground/45" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{session.title || "New Conversation"}</span>
                  <span className="block truncate text-xs font-light text-sky-100/65">
                    {getMessageCountLabel(session.messageCount || 0)}
                    {session.updatedAt ? ` - ${formatSessionDate(session.updatedAt)}` : ""}
                  </span>
                  <span className="mt-1 block truncate text-xs font-light text-foreground/45">{session.preview || "No messages yet"}</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSession(session.id)}
                disabled={Boolean(deletingSessionId)}
                aria-label={`Delete ${session.title || "chat history"}`}
                title="Delete chat history"
                className="mr-1 grid h-8 w-8 place-items-center rounded-lg text-foreground/45 opacity-0 transition hover:bg-red-950/25 hover:text-red-100 group-hover:opacity-100 group-focus-within:opacity-100 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {deletingSessionId === session.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid h-full place-content-center justify-items-center gap-3 text-sm font-light text-foreground/50">
          <History className="h-5 w-5" />
          <span>No chat history yet</span>
        </div>
      )}
    </div>
  );

  return (
    <PageShell eyebrow="NOVA" title="Assistant" lead="A conversational companion for questions about planets, stars, and the spaces between.">
      <div className="mx-auto max-w-3xl">
        <SectionPanel className="flex flex-col rounded-2xl" style={{ height: "65vh" }}>
          <div className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-700/30 px-5 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="m-0 text-sm font-semibold text-foreground">NOVA</p>
              <span className="text-xs font-light text-sky-100/65">{statusText}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={handleNewChat}
                disabled={!canChat || loading}
                aria-label="Start new chat"
                title="Start new chat"
                className="grid h-9 w-9 place-items-center rounded-lg border border-slate-700/45 bg-slate-900/35 text-foreground/70 transition hover:border-sky-300/30 hover:text-sky-100 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <MessageSquarePlus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setHistoryOpen((open) => !open);
                  if (!historyOpen) void loadSessions();
                }}
                disabled={!canChat}
                aria-label="View chat history"
                aria-pressed={historyOpen}
                title="View chat history"
                className="grid h-9 w-9 place-items-center rounded-lg border border-slate-700/45 bg-slate-900/35 text-foreground/70 transition hover:border-sky-300/30 hover:text-sky-100 disabled:cursor-not-allowed disabled:opacity-45 aria-pressed:border-sky-300/35 aria-pressed:bg-sky-400/10 aria-pressed:text-sky-100"
              >
                <History className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSession(sessionId)}
                disabled={!canChat || !sessionId || Boolean(deletingSessionId)}
                aria-label="Delete current chat"
                title="Delete current chat"
                className="grid h-9 w-9 place-items-center rounded-lg border border-slate-700/45 bg-slate-900/35 text-foreground/70 transition hover:border-red-300/25 hover:bg-red-950/25 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {deletingSessionId === sessionId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {!canChat && !authLoading ? (
            <div className="grid flex-1 place-content-center justify-items-center gap-4 p-6 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-500 text-sm font-bold text-slate-950">
                AI
              </div>
              <div>
                <h3 className="m-0 text-xl font-semibold text-foreground">Login to use NOVA</h3>
                <p className="mx-auto mt-2 max-w-md text-sm font-light leading-relaxed text-foreground/55">
                  The chatbot route requires an authenticated account.
                </p>
              </div>
              <Link to="/login" className="rounded-xl bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-300">
                Login
              </Link>
            </div>
          ) : historyOpen ? (
            renderHistoryPanel()
          ) : (
            <div className="flex-1 overflow-y-auto space-y-4 p-6 sm:p-8">
              {messages.map((m, i) => (
                <div key={m.id || i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm font-light leading-relaxed transition-all ${
                    m.role === "user"
                      ? "bg-gradient-to-br from-sky-300 to-blue-300 text-slate-900 rounded-3xl rounded-tr-md shadow-md"
                      : "bg-gradient-to-br from-slate-800/60 to-slate-900/40 border border-slate-700/50 text-foreground/85 rounded-3xl rounded-tl-md"
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {(loading || historyLoading) && (
                <div className="flex justify-start">
                  <div className="rounded-3xl rounded-tl-md border border-slate-700/50 bg-slate-900/40 px-5 py-3 text-sm font-light text-foreground/60">
                    NOVA is thinking...
                  </div>
                </div>
              )}
            </div>
          )}

          {!historyOpen && canChat && (
            <div className="space-y-4 border-t border-slate-700/30 bg-gradient-to-b from-slate-900/20 to-slate-950/40 p-5 sm:p-6">
              {error && (
                <div className="rounded-2xl border border-red-300/20 bg-red-950/20 p-4 text-sm font-light text-red-100/80">
                  {error}
                </div>
              )}

              {messages.length < 3 && (
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      disabled={loading || historyLoading}
                      className="rounded-full border border-slate-600/40 bg-slate-800/40 hover:bg-slate-700/60 px-4 py-2 text-xs font-light tracking-wide text-foreground/70 hover:text-foreground/90 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-slate-800/40 to-slate-900/40 rounded-full border border-slate-700/50 p-1 pl-5 hover:border-slate-600/60 transition-all focus-within:border-slate-600/80"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about planets, stars, mysteries..."
                  disabled={loading || historyLoading}
                  className="min-w-0 flex-1 bg-transparent outline-none text-sm font-light text-foreground placeholder:text-foreground/40 py-2"
                />
                <button
                  type="submit"
                  aria-label="Send"
                  disabled={loading || historyLoading || !input.trim()}
                  className="rounded-full bg-gradient-to-br from-sky-500 to-blue-500 hover:from-sky-400 hover:to-blue-400 disabled:opacity-45 p-2.5 text-slate-900 hover:shadow-lg transition-all"
                >
                  <SendHorizontal className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </SectionPanel>
      </div>
    </PageShell>
  );
}
