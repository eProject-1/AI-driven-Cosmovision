
import { useEffect, useState } from "react";
import { PageShell } from "../components/lovable/PageShell";
import { DividerList } from "../components/lovable/Framing";
import { getNewsList } from "../services/news.api";

const PAGE_SIZE = 6;
const categories = ["ALL", "GENERAL", "SPACE_EXPLORATION", "SOLAR_SYSTEM", "DEEP_SPACE", "TECHNOLOGY"];

export default function LovableNews() {
  const [stories, setStories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");

  useEffect(() => {
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
              className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] ${category === item ? "bg-aurora text-black" : "border border-white/10 text-foreground/70"}`}
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
                <a
                  href={articleUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/15 px-3 py-1 text-xs text-foreground/70 hover:bg-white/10"
                >
                  Open on Spaceflight News
                </a>
              </div>
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
