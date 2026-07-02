import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Compass, LocateFixed, Search, Sparkles } from "lucide-react";
import { PageShell } from "../components/lovable/PageShell";
import { DividerList, SectionPanel } from "../components/lovable/Framing";
import { smartSearch } from "../services/search.api";

const examples = [
  "Show planets with rings",
  "Which constellation is visible in June?",
  "Best observatories near me",
  "Latest NASA news",
];

function getResultLink(item) {
  if (item.type === "planets") return `/planets/${item.slug}`;
  if (item.type === "observatories") return `/observatory/${item.slug}`;
  if (item.type === "news") return item.sourceUrl;
  return null;
}

function ResultItem({ item }) {
  const link = getResultLink(item);
  const external = item.type === "news" && link;
  const body = (
    <article className="grid gap-3 px-6 py-5 transition-colors hover:bg-white/[0.04] sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/35">{item.type}</p>
          <h2 className="mt-2 font-display text-xl font-light text-foreground">{item.name || item.title}</h2>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-foreground/55">
          Score {item.match?.score ?? "-"}
        </span>
      </div>
      <p className="line-clamp-2 text-sm font-light leading-relaxed text-foreground/60">
        {item.description || item.summary || item.aiSummary || item.source || item.category || "Matched by CosmoVision search."}
      </p>
      {item.match?.reasons?.length ? (
        <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-200/60">{item.match.reasons.join(" / ")}</p>
      ) : null}
    </article>
  );

  if (!link) return body;

  return external ? (
    <a href={link} target="_blank" rel="noreferrer">{body}</a>
  ) : (
    <Link to={link}>{body}</Link>
  );
}

export function SmartSearchPanel() {
  const [query, setQuery] = useState("Show planets with rings");
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const flatResults = useMemo(() => result?.flatResults || [], [result]);

  async function runSearch(nextQuery = query) {
    const cleanQuery = nextQuery.trim();
    if (!cleanQuery) return;

    setQuery(cleanQuery);
    setStatus("loading");
    setError("");

    try {
      const data = await smartSearch({
        query: cleanQuery,
        limit: 8,
        lat: coords?.lat,
        lon: coords?.lon,
      });
      setResult(data);
      setStatus("ready");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Search is unavailable.");
      setStatus("error");
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Your browser does not support location access.");
      return;
    }

    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setStatus("idle");
      },
      () => {
        setError("Could not access your location.");
        setStatus("idle");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <>
      <SectionPanel className="p-5 md:p-6">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            runSearch();
          }}
          className="grid gap-4"
        >
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/35" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ask for planets, constellations, observatories, news..."
              className="min-h-14 w-full rounded-2xl border border-white/10 bg-black/25 pl-12 pr-4 text-base text-foreground outline-none transition focus:border-cyan-200/45"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={status === "loading"}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/12 px-5 text-sm text-cyan-50 transition hover:bg-cyan-200/18 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              {status === "loading" ? "Searching" : "Search"}
            </button>
            <button
              type="button"
              onClick={useCurrentLocation}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 text-sm text-foreground/70 transition hover:bg-white/10"
            >
              <LocateFixed className="h-4 w-4" />
              {coords ? "Location ready" : status === "locating" ? "Locating" : "Use location"}
            </button>
          </div>
        </form>

        <div className="mt-5 flex flex-wrap gap-2">
          {examples.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => runSearch(item)}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-foreground/60 transition hover:bg-white/10 hover:text-foreground"
            >
              {item}
            </button>
          ))}
        </div>
      </SectionPanel>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-300/20 bg-red-950/20 p-4 text-sm text-red-100/85">{error}</div>
      ) : null}

      {result ? (
        <div className="mt-10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-foreground/35">Interpreted</p>
              <p className="mt-2 text-sm text-foreground/65">
                {result.interpreted?.targets?.join(", ") || "All sources"} / {result.total} matches
              </p>
            </div>
            <Compass className="h-5 w-5 text-cyan-100/70" />
          </div>
          <DividerList>
            {flatResults.length ? flatResults.map((item) => (
              <ResultItem key={`${item.type}-${item.id || item.slug || item.title}`} item={item} />
            )) : (
              <p className="px-6 py-5 text-sm text-foreground/55">No matching results.</p>
            )}
          </DividerList>
        </div>
      ) : null}
    </>
  );
}

export default function SmartSearch() {
  return (
    <PageShell
      eyebrow="Global Search"
      title="Smart Search"
      lead="Search planets, constellations, observatories, news, and sky events with natural-language queries."
    >
      <SmartSearchPanel />
    </PageShell>
  );
}
