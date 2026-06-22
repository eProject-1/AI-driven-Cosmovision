import { useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "../components/lovable/PageShell";
import { SectionPanel } from "../components/lovable/Framing";
import { SendHorizontal } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { sendMessage } from "../services/chatbot.api";

const CHAT_SESSION_STORAGE_KEY = "cosmovision_assistant_session_id";

export default function LovableAssistant() {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi, I'm NOVA - your astronomy companion. Ask me anything about planets, stars, and the universe.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(() => localStorage.getItem(CHAT_SESSION_STORAGE_KEY));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canChat = Boolean(user);

  const send = async (text) => {
    const value = (text ?? input).trim();
    if (!value || loading || !canChat) return;

    setInput("");
    setError("");
    setLoading(true);
    setMessages((current) => [...current, { role: "user", text: value }]);

    try {
      const result = await sendMessage(value, sessionId);
      if (result.sessionId && result.sessionId !== sessionId) {
        localStorage.setItem(CHAT_SESSION_STORAGE_KEY, result.sessionId);
        setSessionId(result.sessionId);
      }
      setMessages((current) => [...current, { role: "assistant", text: result.reply }]);
    } catch (err) {
      setError(err.response?.data?.message || "Could not connect to chatbot backend.");
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "I could not reach the backend yet. Please make sure the backend is running and you are logged in.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = ["Tell me about Jupiter", "How big is Saturn?", "What is a black hole?"];

  return (
    <PageShell eyebrow="NOVA" title="Assistant" lead="A conversational companion for questions about planets, stars, and the spaces between.">
      <div className="mx-auto max-w-2xl">
        <SectionPanel className="flex flex-col rounded-3xl" style={{ height: "65vh" }}>
          <div className="flex-1 overflow-y-auto space-y-4 p-6 sm:p-8">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm font-light leading-relaxed transition-all ${
                  m.role === "user"
                    ? "bg-gradient-to-br from-sky-300 to-blue-300 text-slate-900 rounded-3xl rounded-tr-md shadow-md"
                    : "bg-gradient-to-br from-slate-800/60 to-slate-900/40 border border-slate-700/50 text-foreground/85 rounded-3xl rounded-tl-md"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-3xl rounded-tl-md border border-slate-700/50 bg-slate-900/40 px-5 py-3 text-sm font-light text-foreground/60">
                  NOVA is thinking...
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-700/30 bg-gradient-to-b from-slate-900/20 to-slate-950/40 p-5 sm:p-6 space-y-4">
            {!authLoading && !canChat && (
              <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-4 text-sm font-light text-foreground/70">
                Please <Link to="/login" className="underline">log in</Link> to chat with the backend-powered assistant.
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-300/20 bg-red-950/20 p-4 text-sm font-light text-red-100/80">
                {error}
              </div>
            )}

            {messages.length < 3 && canChat && (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    disabled={loading}
                    className="rounded-full border border-slate-600/40 bg-slate-800/40 hover:bg-slate-700/60 px-4 py-2 text-xs font-light tracking-wide text-foreground/70 hover:text-foreground/90 transition-all duration-200"
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
                disabled={!canChat || loading}
                className="flex-1 bg-transparent outline-none text-sm font-light text-foreground placeholder:text-foreground/40 py-2"
              />
              <button
                type="submit"
                aria-label="Send"
                disabled={!canChat || loading || !input.trim()}
                className="rounded-full bg-gradient-to-br from-sky-500 to-blue-500 hover:from-sky-400 hover:to-blue-400 disabled:opacity-45 p-2.5 text-slate-900 hover:shadow-lg transition-all"
              >
                <SendHorizontal className="w-4 h-4" />
              </button>
            </form>
          </div>
        </SectionPanel>

        <p className="mt-5 text-center text-xs font-light tracking-widest uppercase text-foreground/30">
          Backend connected assistant
        </p>
      </div>
    </PageShell>
  );
}
