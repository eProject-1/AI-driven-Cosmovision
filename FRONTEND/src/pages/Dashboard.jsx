import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "../components/lovable/PageShell";
import { DataGrid, DividerList } from "../components/lovable/Framing";
import { getDashboardData } from "../services/dashboard.api";
import { getObservatoryImage } from "../utils/observatoryImages";

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

function NearbyObservatoryItem({ item }) {
  const imageUrl = getObservatoryImage(item);

  return (
    <li className="group relative z-0 px-6 py-5 hover:z-50 focus-within:z-50 sm:px-8">
      <Link to={`/observatory/${item.slug}`} className="block">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-base transition-colors group-hover:text-aurora">{item.name}</p>
            <p className="mt-1 text-sm text-foreground/60">
              {item.city} - {item.distanceKm ?? "?"} km away
            </p>
          </div>
          <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-foreground/40">
            Rating {item.rating ?? "N/A"}
          </span>
        </div>
        <p className="mt-2 text-sm text-foreground/70">Sky quality: {item.skyQualityScore ?? "N/A"}</p>
      </Link>

      <div className="pointer-events-none absolute bottom-full left-4 z-[999] mb-3 hidden w-[min(22rem,calc(100vw-3rem))] overflow-hidden rounded-2xl border border-cyan-200/20 bg-slate-950 shadow-2xl shadow-black/70 ring-1 ring-white/10 group-hover:block group-focus-within:block sm:left-auto sm:right-4">
        <img src={imageUrl} alt={item.name} className="h-36 w-full object-cover" loading="lazy" />
        <div className="bg-slate-950 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg font-light">{item.name}</p>
              <p className="mt-1 text-xs text-foreground/55">{item.address || item.city}</p>
            </div>
            <span className="shrink-0 rounded-full border border-white/10 px-2 py-1 text-[10px] text-foreground/50">
              {item.distanceKm ?? "?"} km
            </span>
          </div>
          <p className="mt-3 line-clamp-3 text-sm font-light leading-relaxed text-foreground/65">
            {item.description || "No description available."}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] uppercase tracking-[0.18em] text-foreground/45">
            <span className="rounded-xl bg-white/[0.04] px-2 py-2">Sky {item.skyQualityScore ?? "N/A"}</span>
            <span className="rounded-xl bg-white/[0.04] px-2 py-2">Light {item.lightPollutionScore ?? "N/A"}</span>
            <span className="rounded-xl bg-white/[0.04] px-2 py-2">Rate {item.rating ?? "N/A"}</span>
          </div>
        </div>
      </div>
    </li>
  );
}

function DashboardNewsItem({ item }) {
  const articleUrl = item.sourceUrl || item.url || "#";
  const imageUrl =
    item.imageUrl ||
    "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80";

  return (
    <li className="group relative z-0 px-3 py-3 hover:z-50 focus-within:z-50">
      <a href={articleUrl} target="_blank" rel="noreferrer" className="block">
        <p className="font-display text-base transition-colors group-hover:text-aurora">{item.title}</p>
        <p className="mt-1 line-clamp-2 text-sm text-foreground/60">{item.summary || item.source}</p>
      </a>

      <div className="pointer-events-none absolute bottom-full left-0 z-[999] mb-3 hidden w-[min(24rem,calc(100vw-3rem))] overflow-hidden rounded-2xl border border-cyan-200/20 bg-slate-950 shadow-2xl shadow-black/70 ring-1 ring-white/10 group-hover:block group-focus-within:block sm:left-auto sm:right-0">
        <img src={imageUrl} alt={item.title} className="h-40 w-full object-cover" loading="lazy" />
        <div className="bg-slate-950 p-4">
          <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.22em] text-foreground/40">
            <span>{item.source || "Space news"}</span>
            <span>{item.publishedAt ? formatDate(item.publishedAt) : "Latest"}</span>
          </div>
          <p className="mt-3 font-display text-lg font-light leading-snug">{item.title}</p>
          <p className="mt-3 line-clamp-3 text-sm font-light leading-relaxed text-foreground/65">
            {item.summary || "Open this story to read the full article."}
          </p>
          <p className="mt-4 text-[10px] uppercase tracking-[0.25em] text-cyan-200/70">Open article</p>
        </div>
      </div>
    </li>
  );
}

export default function LovableDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const fetchDashboard = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setRefreshing(true);
    setError("");
    try {
      const result = await getDashboardData({ limit: 5 });
      setData(result);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not load dashboard data.");
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard(true);
    const interval = window.setInterval(() => fetchDashboard(false), 300000);
    return () => window.clearInterval(interval);
  }, []);

  const stats = data
    ? [
        { label: "Sky visibility", value: `${data.sky?.score ?? 0}`, of: data.sky?.label ?? "Unknown" },
        { label: "Upcoming events", value: `${data.upcomingEvents?.length ?? 0}`, of: "scheduled" },
        { label: "Nearby observatories", value: `${data.nearbyObservatories?.length ?? 0}`, of: "near you" },
        { label: "Recommendation", value: data?.recommendation?.aiSuggestion ? "Personal" : "—", of: data?.recommendation?.aiSuggestion ? "Available" : "None" },
      ]
    : [
        { label: "Sky visibility", value: "—", of: "loading" },
        { label: "Upcoming events", value: "—", of: "loading" },
        { label: "Nearby observatories", value: "—", of: "loading" },
        { label: "Recommendation", value: "—", of: "loading" },
      ];

  const weather = data?.sky?.weather;
  const cloudCover = weather?.cloudCover ?? weather?.cloudiness;
  const suggestion = data?.sky?.suggestion;
  const observatories = data?.nearbyObservatories || [];
  const news = data?.latestNews || [];
  const events = data?.upcomingEvents || [];
  const skyScore = data?.sky?.score ?? 0;
  const skyStatus = skyScore >= 80 ? "Excellent" : skyScore >= 60 ? "Good" : skyScore >= 40 ? "Fair" : "Poor";

  return (
    <PageShell eyebrow="Mission Log" title="Dashboard" lead="Live sky conditions, weather, astronomy events, and observatory recommendations from the backend.">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-background/70 px-4 py-4 backdrop-blur-sm">
        <div>
          <p className="text-[10px] font-light uppercase tracking-[0.35em] text-foreground/40">Live status</p>
          <p className="mt-2 font-display text-2xl">{now.toLocaleString("vi-VN")}</p>
          <p className="text-sm text-foreground/60">{data?.current?.location?.name || "Current location"}</p>
        </div>
        <button
          onClick={() => fetchDashboard(true)}
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-foreground/70 transition hover:bg-white/10"
          disabled={refreshing}
        >
          {refreshing ? "Updating..." : "Refresh live data"}
        </button>
      </div>

      {loading ? (
        <p className="mb-6 text-sm text-foreground/60">Loading live dashboard data...</p>
      ) : null}

      {error ? (
        <div className="mb-6 rounded-2xl border border-red-300/20 bg-red-950/20 p-4 text-sm text-red-100/80">
          {error}
        </div>
      ) : null}

      <DataGrid columns="sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-background/70 p-8 backdrop-blur-sm">
            <p className="text-[10px] font-light tracking-[0.3em] uppercase text-foreground/40">{s.label}</p>
            <p className="mt-6 font-display text-5xl font-light tracking-tight tabular-nums">{s.value}</p>
            <p className="mt-2 text-[10px] font-light tracking-[0.2em] uppercase text-foreground/35">{s.of}</p>
          </div>
        ))}
      </DataGrid>

      <div className="mt-16 grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-3xl border border-white/10 bg-background/60 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[10px] font-light uppercase tracking-[0.35em] text-foreground/40">Sky overview</h2>
              <p className="mt-3 text-sm leading-relaxed text-foreground/70">{data?.recommendation?.aiSuggestion || suggestion || "No sky suggestion available yet."}</p>
            </div>
            <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">
              {skyStatus}
            </div>
          </div>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.max(8, skyScore)}%` }} />
          </div>
          <p className="mt-2 text-sm text-foreground/60">Visibility score: {skyScore}/100</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-background/70 p-4">
              <p className="text-[10px] uppercase tracking-[0.25em] text-foreground/35">Humidity</p>
              <p className="mt-2 font-display text-xl">{weather?.humidity ?? "—"}%</p>
              <p className="mt-1 text-sm text-foreground/60">Wind {weather?.windSpeed ?? "—"} km/h</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-background/70 p-4">
              <p className="text-[10px] uppercase tracking-[0.25em] text-foreground/35">Cloud cover</p>
              <p className="mt-2 font-display text-xl">{cloudCover ?? "—"}%</p>
              <p className="mt-1 text-sm text-foreground/60">Visibility {weather?.visibility ?? "—"} km</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-background/70 p-4">
              <p className="text-[10px] uppercase tracking-[0.25em] text-foreground/35">Sunrise / Sunset</p>
              <p className="mt-2 text-sm text-foreground/70">{formatTime(weather?.sunrise)} · {formatTime(weather?.sunset)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-background/70 p-4">
              <p className="text-[10px] uppercase tracking-[0.25em] text-foreground/35">Temperature</p>
              <p className="mt-2 font-display text-xl">{weather?.temperature ?? "—"}°C</p>
              <p className="mt-1 text-sm text-foreground/60">Feels like {weather?.feelsLike ?? "—"}°C</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-background/60 p-6">
          <h2 className="text-[10px] font-light uppercase tracking-[0.35em] text-foreground/40">Latest space news</h2>
          <DividerList as="ul" className="relative z-20 mt-4" allowOverflow>
            {news.length > 0 ? news.map((item) => (
              <DashboardNewsItem key={item.id} item={item} />
            )) : <li className="px-3 py-3 text-sm text-foreground/60">No news available.</li>}
          </DividerList>
        </section>
      </div>

      <div className="mt-16 grid gap-8 xl:grid-cols-[1fr_1fr]">
        <section>
          <h2 className="font-sans text-[10px] font-light tracking-[0.45em] uppercase text-foreground/40">Upcoming astronomy events</h2>
          <DividerList as="ul" className="mt-6">
            {events.length > 0 ? events.map((event) => (
              <li key={event.id} className="px-6 py-5 sm:px-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-display text-base">{event.title}</p>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                    {event.type}
                  </span>
                </div>
                <p className="mt-2 text-sm text-foreground/60">{formatDate(event.startDate)} · {formatTime(event.startDate)}</p>
                <p className="mt-2 text-sm text-foreground/70">{event.description || "No description available."}</p>
              </li>
            )) : <li className="px-6 py-5 text-sm text-foreground/60">No upcoming events available.</li>}
          </DividerList>
        </section>

        <section>
          <h2 className="font-sans text-[10px] font-light tracking-[0.45em] uppercase text-foreground/40">Nearby observatories</h2>
          <DividerList as="ul" className="relative z-20 mt-6" allowOverflow>
            {observatories.length > 0 ? observatories.map((item) => (
              <NearbyObservatoryItem key={item.id} item={item} />
            )) : <li className="px-6 py-5 text-sm text-foreground/60">No nearby observatories available.</li>}
          </DividerList>
        </section>
      </div>
    </PageShell>
  );
}

