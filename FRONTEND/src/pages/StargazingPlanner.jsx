import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, LocateFixed, RefreshCw, Sparkles } from "lucide-react";
import { PageShell } from "../components/lovable/PageShell";
import { DataGrid, DividerList, SectionPanel } from "../components/lovable/Framing";
import { useAuth } from "../context/AuthContext";
import {
  createRecommendation,
  getRecommendationHistory,
  refreshRecommendation,
} from "../services/recommendation.api";

function formatTime(value) {
  if (!value) return "--";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Metric({ label, value }) {
  return (
    <div className="bg-background/70 p-6 backdrop-blur-sm">
      <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/35">{label}</p>
      <p className="mt-4 font-display text-3xl font-light text-foreground">{value ?? "--"}</p>
    </div>
  );
}

export function StargazingPlannerPanel() {
  const { user, loading: authLoading } = useAuth();
  const [inputMode, setInputMode] = useState("place");
  const [form, setForm] = useState({
    locationName: "",
    latitude: "",
    longitude: "",
  });
  const [recommendation, setRecommendation] = useState(null);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    getRecommendationHistory({ limit: 5 })
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [user]);

  function useLocation() {
    if (!navigator.geolocation) {
      setError("Your browser does not support location access.");
      return;
    }

    setStatus("locating");
    setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({
          ...current,
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
          locationName: current.locationName || "Current location",
        }));
        setInputMode("coords");
        setStatus("idle");
      },
      () => {
        setError("Could not access your location.");
        setStatus("idle");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function submit(event) {
    event.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const payload = inputMode === "place"
        ? { locationName: form.locationName.trim() }
        : {
            latitude: Number(form.latitude),
            longitude: Number(form.longitude),
            locationName: form.locationName.trim() || "Custom coordinates",
          };

      const data = await createRecommendation(payload);
      setRecommendation(data);
      const nextHistory = await getRecommendationHistory({ limit: 5 });
      setHistory(nextHistory);
      setStatus("ready");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not create recommendation.");
      setStatus("error");
    }
  }

  async function refreshCurrent() {
    if (!recommendation?.id) return;
    setStatus("loading");
    setError("");
    try {
      const data = await refreshRecommendation(recommendation.id);
      setRecommendation(data);
      const nextHistory = await getRecommendationHistory({ limit: 5 });
      setHistory(nextHistory);
      setStatus("ready");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not refresh recommendation.");
      setStatus("error");
    }
  }

  if (!authLoading && !user) {
    return (
      <SectionPanel className="p-8">
        <p className="text-sm text-foreground/65">The planner stores your sky snapshots, so it needs an account.</p>
        <Link to="/login" className="mt-5 inline-flex min-h-11 items-center rounded-full border border-cyan-200/20 bg-cyan-200/12 px-5 text-sm text-cyan-50">
          Login
        </Link>
      </SectionPanel>
    );
  }

  const weather = recommendation?.weatherDetail;
  const observatories = recommendation?.nearbyObservatoryDetail || [];
  const canPlan = inputMode === "place"
    ? Boolean(form.locationName.trim())
    : Boolean(form.latitude && form.longitude);

  return (
    <>
      <SectionPanel className="p-5 md:p-6">
        <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
          {[
            ["place", "Place name"],
            ["coords", "Coordinates"],
          ].map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => setInputMode(mode)}
              className={[
                "min-h-9 rounded-full px-4 text-sm transition",
                inputMode === mode ? "bg-cyan-200/14 text-cyan-50" : "text-foreground/55 hover:text-foreground",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className={inputMode === "place" ? "grid gap-4 lg:grid-cols-[1fr_auto]" : "grid gap-4 lg:grid-cols-[0.9fr_0.65fr_0.65fr_auto]"}>
          {inputMode === "place" ? (
            <input
              value={form.locationName}
              onChange={(event) => setForm((current) => ({ ...current, locationName: event.target.value }))}
              placeholder="City or observing site, e.g. Hanoi, Vietnam"
              className="min-h-12 rounded-2xl border border-white/10 bg-black/25 px-4 text-sm outline-none focus:border-cyan-200/45"
            />
          ) : (
            <>
              <input
                value={form.locationName}
                onChange={(event) => setForm((current) => ({ ...current, locationName: event.target.value }))}
                placeholder="Optional label"
                className="min-h-12 rounded-2xl border border-white/10 bg-black/25 px-4 text-sm outline-none focus:border-cyan-200/45"
              />
              <input
                value={form.latitude}
                onChange={(event) => setForm((current) => ({ ...current, latitude: event.target.value }))}
                placeholder="Latitude"
                inputMode="decimal"
                className="min-h-12 rounded-2xl border border-white/10 bg-black/25 px-4 text-sm outline-none focus:border-cyan-200/45"
              />
              <input
                value={form.longitude}
                onChange={(event) => setForm((current) => ({ ...current, longitude: event.target.value }))}
                placeholder="Longitude"
                inputMode="decimal"
                className="min-h-12 rounded-2xl border border-white/10 bg-black/25 px-4 text-sm outline-none focus:border-cyan-200/45"
              />
            </>
          )}
          <button
            type="submit"
            disabled={status === "loading" || !canPlan}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-cyan-200/20 bg-cyan-200/12 px-5 text-sm text-cyan-50 transition hover:bg-cyan-200/18 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {status === "loading" ? "Planning" : "Plan"}
          </button>
        </form>

        <button
          type="button"
          onClick={useLocation}
          className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm text-foreground/70 transition hover:bg-white/10"
        >
          <LocateFixed className="h-4 w-4" />
          {status === "locating" ? "Locating" : "Use current location"}
        </button>
      </SectionPanel>

      {error ? <div className="mt-6 rounded-2xl border border-red-300/20 bg-red-950/20 p-4 text-sm text-red-100/85">{error}</div> : null}

      {recommendation ? (
        <div className="mt-10 space-y-8">
          <DataGrid columns="sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Sky score" value={`${recommendation.skyVisibilityScore ?? "--"}/100`} />
            <Metric label="Weather" value={weather?.label || recommendation.weatherCondition} />
            <Metric label="Best start" value={formatTime(recommendation.bestTimeStart)} />
            <Metric label="Best end" value={formatTime(recommendation.bestTimeEnd)} />
          </DataGrid>

          <section className="rounded-3xl border border-white/10 bg-background/60 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-foreground/35">AI suggestion</p>
                <p className="mt-4 max-w-3xl whitespace-pre-wrap text-sm font-light leading-relaxed text-foreground/75">
                  {recommendation.aiSuggestion || "No AI suggestion available."}
                </p>
              </div>
              <button
                type="button"
                onClick={refreshCurrent}
                disabled={status === "loading"}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm text-foreground/70 transition hover:bg-white/10 disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </section>

          <div className="grid gap-8 xl:grid-cols-2">
            <section>
              <h2 className="mb-5 text-[10px] uppercase tracking-[0.35em] text-foreground/35">Visible targets</h2>
              <SectionPanel className="p-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-foreground/35">Planets</p>
                    <p className="mt-3 text-sm text-foreground/75">{recommendation.visiblePlanets?.join(", ") || "None listed"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-foreground/35">Constellations</p>
                    <p className="mt-3 text-sm text-foreground/75">{recommendation.visibleConstellations?.join(", ") || "None listed"}</p>
                  </div>
                </div>
              </SectionPanel>
            </section>

            <section>
              <h2 className="mb-5 text-[10px] uppercase tracking-[0.35em] text-foreground/35">Nearby observatories</h2>
              <DividerList as="ul">
                {observatories.length ? observatories.slice(0, 5).map((item) => (
                  <li key={item.id} className="px-6 py-4">
                    <Link to={`/observatory/${item.slug}`} className="block">
                      <p className="font-display text-base">{item.name}</p>
                      <p className="mt-1 text-sm text-foreground/60">{item.city || item.province} / {item.distanceKm ?? "--"} km</p>
                    </Link>
                  </li>
                )) : (
                  <li className="px-6 py-4 text-sm text-foreground/55">No observatories found nearby.</li>
                )}
              </DividerList>
            </section>
          </div>
        </div>
      ) : null}

      {history.length ? (
        <section className="mt-12">
          <h2 className="mb-5 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-foreground/35">
            <CalendarClock className="h-4 w-4" />
            Recent plans
          </h2>
          <DividerList>
            {history.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRecommendation(item)}
                className="w-full px-6 py-4 text-left transition hover:bg-white/[0.04]"
              >
                <p className="font-display text-base">{item.locationName || "Saved location"}</p>
                <p className="mt-1 text-sm text-foreground/55">Score {item.skyVisibilityScore ?? "--"} / {formatTime(item.createdAt)}</p>
              </button>
            ))}
          </DividerList>
        </section>
      ) : null}
    </>
  );
}

export default function StargazingPlanner() {
  return (
    <PageShell
      eyebrow="Planner"
      title="Stargazing Planner"
      lead="Generate a personalized observing plan using your location, weather, NASA signals, and nearby observatories."
    >
      <StargazingPlannerPanel />
    </PageShell>
  );
}
