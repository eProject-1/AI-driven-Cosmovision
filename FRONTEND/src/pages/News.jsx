
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "../components/lovable/PageShell";
import { DividerList } from "../components/lovable/Framing";
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
      {activeResult ? (
        <div className="mt-4 whitespace-pre-wrap rounded-2xl border border-cyan-200/15 bg-cyan-950/20 p-4 text-sm leading-relaxed text-foreground/85">
          {activeResult}
        </div>
      ) : null}
    </div>
  );
}

export default function LovableNews() {
  const { search: searchString } = window.location;
  void searchString;

  const [stories, setStories] = useState([]);
  // pagination/loading/page/search/category state is declared above


  const highlightedSlugRef = useRef(null);
  const [highlightedSlug, setHighlightedSlug] = useState(null);

  const articleSlugFromUrl = useMemo(() => {
    try {
      const url = new URL(window.location.href);
      const fromQuery = url.searchParams.get("article");
      if (fromQuery) return decodeURIComponent(fromQuery);
      return null;
    } catch {
      return null;
    }
  }, []);

  const tryScrollToSlug = (slug) => {
    if (!slug) return false;
    const el = document.querySelector(`[data-article-slug="${CSS.escape(slug)}"]`);
    if (!el) return false;

    el.scrollIntoView({ behavior: "smooth", block: "center" });

    highlightedSlugRef.current = slug;
    setHighlightedSlug(slug);
    window.setTimeout(() => {
      if (highlightedSlugRef.current === slug) setHighlightedSlug(null);
    }, 2000);

    return true;
  };

  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");

  // scroll logic handled below after stories render
  useEffect(() => {
    if (!articleSlugFromUrl) return;
    if (category !== "ALL") setCategory("ALL");
    if (page !== 1) setPage(1);
  }, [articleSlugFromUrl, category, page]);

  useEffect(() => {
    if (!articleSlugFromUrl) return;
    if (loading) return;
    if (!stories || stories.length === 0) return;

    const targetSlug = articleSlugFromUrl;
    // Nếu target có nằm trong page hiện tại, scroll + highlight
    const found = tryScrollToSlug(targetSlug);
    if (found) return;

    // Nếu không thấy, thử tăng page để tìm đến bài (pagination có thể che khuất bài)
    if (pagination && page < (pagination.totalPages || 1)) {
      setPage((prev) => prev + 1);
    }
  }, [articleSlugFromUrl, loading, stories, pagination, page]);


  useEffect(() => {
    if (articleSlugFromUrl) {
      if (category !== "ALL") setCategory("ALL");
      if (page !== 1) setPage(1);
    }

    const forcedSlug = articleSlugFromUrl;

    if (forcedSlug) {
      if (category !== "ALL") setCategory("ALL");
      if (page !== 1) setPage(1);
    }

    setLoading(true);

    const params = {
      page,
      limit: PAGE_SIZE,
      ...(category !== "ALL" ? { category } : {}),
      ...(search ? { search } : {}),
    };

    getNewsList(params)
      .then((result) => {
        setStories(result.items || []);
        setPagination(result.pagination || null);
      })
      .catch(() => {
        setStories([]);
        setPagination(null);
      })
      .finally(() => setLoading(false));
  }, [page, category, search]);

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
      eyebrow="Chapter IV"
      title="News"
      lead="Dispatches from observatories, agencies, and missions across the Solar System and beyond."
    >
      {loading ? <p className="text-sm text-foreground/60">Loading news from backend...</p> : null}

      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-background/50 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setPage(1);
                setCategory(item);
              }}
              className={[
                "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em]",
                "transition duration-300 ease-out hover:scale-105 hover:border-white/40 hover:bg-white/15 hover:text-white",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
                category === item
                  ? "border-white bg-white text-black shadow-lg shadow-white/10"
                  : "border-white/10 bg-white/[0.03] text-foreground/75",
              ].join(" ")}
            >
              {item === "ALL" ? "All" : item.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search news"
            className="rounded-full border border-white/10 bg-transparent px-3 py-2 text-sm outline-none"
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

      <div className="mb-6 flex items-center justify-between text-sm text-foreground/60">
        <span>{pagination ? `Page ${pagination.page} of ${pagination.totalPages || 1}` : "Latest updates"}</span>
        <span>{pagination ? `${pagination.total} articles` : ""}</span>
      </div>

      <DividerList>
        {stories.map((s) => {
          const articleUrl = s.sourceUrl || s.url || "#";

          return (
              <article
                key={s.id}
                data-article-slug={s.slug}
                className={`px-6 py-8 sm:px-8 md:px-10 md:py-10 transition-colors ${highlightedSlug === s.slug ? "ring-2 ring-cyan-300/80 bg-cyan-950/30" : ""}`}
              >
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

              <NewsAiPanel story={s} onArticleUpdate={updateStory} />
            </article>
          );
        })}
      </DividerList>

      {pagination && (
        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-foreground/70 disabled:opacity-40"
          >
            Previous
          </button>

          <span className="text-sm text-foreground/60">Showing page {pagination.page}</span>

          <button
            type="button"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={page >= (pagination.totalPages || 1)}
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-foreground/70 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {!loading && stories.length === 0 ? <p className="text-sm text-foreground/60">No news articles available yet.</p> : null}
    </PageShell>
  );
}
