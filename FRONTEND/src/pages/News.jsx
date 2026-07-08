
import { useEffect, useState } from "react";
import { AdminResourceActions } from "../components/admin/AdminResourceActions";
import { FilterPill } from "../components/common/FilterControls";
import { Pagination } from "../components/common/Pagination";
import { SearchField } from "../components/common/SearchField";
import { PageShell } from "../components/lovable/PageShell";
import { DividerList } from "../components/lovable/Framing";
import { useAuth } from "../context/authState";
import {
  askNewsQuestion,
  explainNewsArticle,
  generateNewsAiCategory,
  generateNewsAiSummary,
  generateNewsAiTags,
  generateNewsImportance,
  getNewsList,
} from "../services/news.api";

const PAGE_SIZE = 6;
const categories = ["ALL", "GENERAL", "SPACE_EXPLORATION", "SOLAR_SYSTEM", "DEEP_SPACE", "TECHNOLOGY"];
const newsCreateTemplate = {
  title: "New astronomy article",
  slug: "new-astronomy-article",
  summary: "Write a short summary.",
  content: "Write the article content.",
  source: "CosmoVision",
  sourceUrl: "https://example.com",
  category: "GENERAL",
  publishedAt: new Date().toISOString(),
};

function stripAiMarkdown(value = "") {
  return String(value)
    .replace(/\*\*/g, "")
    .replace(/__+/g, "")
    .replace(/`+/g, "")
    .trim();
}

function parseJsonResult(value) {
  const raw = String(value || "")
    .replace(/```json|```/gi, "")
    .trim();

  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) return null;

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function collectAiLines(value, lines = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectAiLines(item, lines));
    return lines;
  }

  if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collectAiLines(item, lines));
    return lines;
  }

  const text = stripAiMarkdown(value);
  if (text) lines.push(text);
  return lines;
}

function normalizeStructuredAiLine(line) {
  return stripAiMarkdown(line)
    .replace(/^\s*[-*.\u2022]\s*/, "")
    .replace(/^\s*\d+[.)]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getStructuredAiType(line, text) {
  const raw = String(line || "").trim();
  if (text.endsWith("?")) return "question";
  if (/^\.\s+/.test(raw) || /^\u2022\s+/.test(raw)) return "sub";
  return "main";
}

function hasStructuredAiContent(text) {
  return String(text)
    .trim()
    .split("")
    .some((char) => !`[]{}"':,`.includes(char));
}

function toStructuredAiItems(value) {
  const parsed = parseJsonResult(value);
  const sourceLines = parsed ? collectAiLines(parsed) : String(value || "").split(/\n+/);

  return sourceLines
    .flatMap((line) => String(line).split(/(?=\s[-*.\u2022]\s+)/g))
    .map((line) => {
      const text = normalizeStructuredAiLine(line);
      return {
        text,
        type: getStructuredAiType(line, text),
      };
    })
    .filter((item) => item.text)
    .filter((item) => hasStructuredAiContent(item.text));
}

function StructuredAiResult({ value }) {
  const items = toStructuredAiItems(value);
  if (!items.length) return null;

  return (
    <div className="mt-4 space-y-4 rounded-2xl border border-cyan-200/15 bg-cyan-950/20 p-5 text-[17px] leading-8 text-foreground/85">
      {items.map((item, index) => {
        const key = `${item.text}-${index}`;

        if (item.type === "question") {
          return (
            <p key={key} className="font-bold text-white">
              {item.text}
            </p>
          );
        }

        if (item.type === "sub") {
          return (
            <p key={key} className="ml-6 flex gap-3 text-[16px] leading-7 text-foreground/75">
              <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-200/70" />
              <span>{item.text}</span>
            </p>
          );
        }

        return (
          <p key={key} className="flex gap-3">
            <span className="shrink-0 text-cyan-100/90">-</span>
            <span>{item.text}</span>
          </p>
        );
      })}
    </div>
  );
}

function NewsAiPanel({ story, onArticleUpdate }) {
  const [loadingAction, setLoadingAction] = useState("");
  const [activeResult, setActiveResult] = useState("");
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");

  const runArticleAction = async (action, label, pickResult) => {
    setLoadingAction(label);
    setActiveResult("");
    setError("");
    try {
      const article = await action(story.id);
      onArticleUpdate(article);
      setActiveResult(pickResult(article));
    } catch (err) {
      setError(err.response?.data?.message || "AI feature is unavailable right now.");
    } finally {
      setLoadingAction("");
    }
  };

  const runExplain = async () => {
    setLoadingAction("Explain");
    setError("");
    try {
      const result = await explainNewsArticle(story.id);
      setActiveResult(result.explanation);
    } catch (err) {
      setError(err.response?.data?.message || "AI explanation is unavailable right now.");
    } finally {
      setLoadingAction("");
    }
  };

  const askQuestion = async (event) => {
    event.preventDefault();
    if (!question.trim()) return;

    setLoadingAction("Ask");
    setError("");
    try {
      const result = await askNewsQuestion(story.id, question.trim());
      setActiveResult(result.answer);
    } catch (err) {
      setError(err.response?.data?.message || "AI Q&A is unavailable right now.");
    } finally {
      setLoadingAction("");
    }
  };

  const buttonClass =
    "rounded-full border border-white/15 bg-white/[0.03] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/75 transition duration-300 hover:scale-105 hover:border-white/40 hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!!loadingAction}
          onClick={() => runArticleAction(generateNewsAiSummary, "Summary", (article) => article.aiSummary || "No AI summary generated.")}
          className={buttonClass}
        >
          AI Summary
        </button>
        <button
          type="button"
          disabled={!!loadingAction}
          onClick={() => runArticleAction(generateNewsImportance, "Why it matters", (article) => article.importance || "No importance generated.")}
          className={buttonClass}
        >
          Why it matters
        </button>
        <button type="button" disabled={!!loadingAction} onClick={runExplain} className={buttonClass}>
          Explain
        </button>
        <button
          type="button"
          disabled={!!loadingAction}
          onClick={() => runArticleAction(generateNewsAiTags, "Tags", (article) => `Tags: ${(article.tags || []).join(", ") || "No tags"}`)}
          className={buttonClass}
        >
          Tags
        </button>
        <button
          type="button"
          disabled={!!loadingAction}
          onClick={() => runArticleAction(generateNewsAiCategory, "Category", (article) => `AI category: ${article.aiCategory || "GENERAL"}`)}
          className={buttonClass}
        >
          Category
        </button>
      </div>

      <form onSubmit={askQuestion} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask AI about this article"
          className="min-h-11 flex-1 rounded-full border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none focus:border-white/40"
        />
        <button type="submit" disabled={!!loadingAction || !question.trim()} className={buttonClass}>
          Ask
        </button>
      </form>

      {loadingAction ? <p className="mt-3 text-sm text-cyan-100/80">AI is working on {loadingAction}...</p> : null}
      {error ? <p className="mt-3 text-sm text-red-200/85">{error}</p> : null}
      {activeResult ? <StructuredAiResult value={activeResult} /> : null}
    </div>
  );
}

export default function LovableNews() {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const isAdmin = user?.role === "ADMIN";

  const loadNews = (options = {}) => {
    setLoading(true);

    const params = {
      page,
      limit: PAGE_SIZE,
      ...(category !== "ALL" ? { category } : {}),
      ...(search ? { search } : {}),
    };

    getNewsList(params, { skipCache: options.skipCache || isAdmin })
      .then((result) => {
        setStories(result.items || []);
        setPagination(result.pagination || null);
      })
      .catch(() => {
        setStories([]);
        setPagination(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadNews();
  }, [page, category, search, isAdmin]);

  const handleRefresh = () => {
    setPage(1);
    setCategory("ALL");
    setSearch("");
    setLoading(true);

    getNewsList({ page: 1, limit: PAGE_SIZE }, { skipCache: true })
      .then((result) => {
        setStories(result.items || []);
        setPagination(result.pagination || null);
      })
      .catch(() => {
        setStories([]);
        setPagination(null);
      })
      .finally(() => setLoading(false));
  };

  const updateStory = (updatedArticle) => {
    setStories((current) =>
      current.map((story) => (story.id === updatedArticle.id ? { ...story, ...updatedArticle } : story))
    );
  };

  return (
    <PageShell
      title="News"
      lead="Dispatches from observatories, agencies, and missions across the Solar System and beyond."
    >
      {loading ? <p className="text-sm text-foreground/60">Loading news from backend...</p> : null}

      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-background/50 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((item) => (
            <FilterPill
              key={item}
              active={category === item}
              onClick={() => {
                setPage(1);
                setCategory(item);
              }}
            >
              {item === "ALL" ? "All" : item.replace(/_/g, " ")}
            </FilterPill>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <SearchField
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search news"
            inputClassName="min-h-10 rounded-full bg-transparent pl-10 pr-3 py-2 text-sm"
            iconClassName="left-3 h-4 w-4"
          />
          <button
            type="button"
            onClick={handleRefresh}
            className="rounded-full border border-white/10 px-3 py-2 text-sm text-foreground/70"
          >
            Refresh
          </button>
        </div>
      </div>
      {isAdmin ? (
        <div className="mb-6">
          <AdminResourceActions
            resourceName="news article"
            endpoint="/news"
            createTemplate={newsCreateTemplate}
            onCreated={() => loadNews({ skipCache: true })}
          />
        </div>
      ) : null}

      <div className="mb-6 flex items-center justify-between text-sm text-foreground/60">
        <span>{pagination ? `Page ${pagination.page} of ${pagination.totalPages || 1}` : "Latest updates"}</span>
        <span>{pagination ? `${pagination.total} articles` : ""}</span>
      </div>

      {pagination && (
        <Pagination
          className="mb-10"
          page={pagination.page || page}
          totalPages={pagination.totalPages || 1}
          disabled={loading}
          onPageChange={setPage}
        />
      )}

      <DividerList>
        {stories.map((s) => {
          const articleUrl = s.sourceUrl || s.url || "#";

          return (
            <article key={s.id} className="px-6 py-8 sm:px-8 md:px-10 md:py-10">
              <div className="flex items-center gap-4 text-[10px] font-light tracking-[0.3em] uppercase text-foreground/40">
                <span>{new Date(s.publishedAt).toLocaleDateString()}</span>
                <span className="h-px w-6 bg-foreground/20" />
                <span>{s.category}</span>
              </div>

              {s.imageUrl ? (
                <img src={s.imageUrl} alt={s.title} className="mt-4 h-48 w-full rounded-2xl object-cover" />
              ) : null}

              <a
                href={articleUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 block font-display text-2xl md:text-3xl font-light tracking-tight leading-snug text-foreground/90 hover:text-aurora"
              >
                {s.title}
              </a>

              <p className="mt-4 max-w-2xl text-sm md:text-base font-light leading-relaxed text-foreground/55">
                {s.summary || s.source}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="text-[10px] font-light tracking-[0.25em] uppercase text-foreground/35">{s.source}</span>
                {s.category ? (
                  <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-foreground/70">
                    {s.category}
                  </span>
                ) : null}
                <a
                  href={articleUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/15 px-3 py-1 text-xs text-foreground/70 hover:bg-white/10"
                >
                  Open on Spaceflight News
                </a>
              </div>

              {isAdmin ? (
                <div className="mt-5">
                  <AdminResourceActions
                    resourceName="news article"
                    endpoint="/news"
                    slug={s.slug}
                    item={s}
                    onUpdated={() => loadNews({ skipCache: true })}
                    onDeleted={() => loadNews({ skipCache: true })}
                  />
                </div>
              ) : null}

              <NewsAiPanel story={s} onArticleUpdate={updateStory} />
            </article>
          );
        })}
      </DividerList>

      {pagination && (
        <Pagination
          className="mt-10"
          page={pagination.page || page}
          totalPages={pagination.totalPages || 1}
          disabled={loading}
          onPageChange={setPage}
        />
      )}

      {!loading && stories.length === 0 ? <p className="text-sm text-foreground/60">No news articles available yet.</p> : null}
    </PageShell>
  );
}
