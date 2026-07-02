import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Filter, LocateFixed, MapPin, Search, Star } from "lucide-react";
import { PageShell } from "../components/lovable/PageShell";
import { SectionPanel } from "../components/lovable/Framing";
import {
  getNearbyObservatories,
  getObservatories,
  getObservatoryStats,
} from "../services/observatory.api";
import { getObservatoryImage } from "../utils/observatoryImages";
import { StargazingPlannerPanel } from "./StargazingPlanner";

const typeFilters = [
  { value: "ALL", label: "All" },
  { value: "PUBLIC", label: "Observatory" },
  { value: "STARGAZING_SITE", label: "Stargazing" },
  { value: "UNIVERSITY", label: "University" },
  { value: "PRIVATE", label: "Private" },
];

function mapEmbedUrl(site) {
  if (!site?.latitude || !site?.longitude) return null;
  const lat = Number(site.latitude);
  const lon = Number(site.longitude);
  const delta = 0.08;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lon - delta}%2C${lat - delta}%2C${lon + delta}%2C${lat + delta}&layer=mapnik&marker=${lat}%2C${lon}`;
}

function StatTile({ label, value }) {
  return (
    <div className="border border-white/10 bg-background/70 px-4 py-4">
      <div className="text-[11px] uppercase tracking-[0.25em] text-foreground/40">{label}</div>
      <div className="mt-2 font-display text-3xl text-foreground">{value ?? "--"}</div>
    </div>
  );
}

function ObservatoryCard({ site, compact = false }) {
  const condition = site.observingCondition;

  return (
    <Link
      to={`/observatory/${site.slug}`}
      className="group grid gap-4 border-b border-white/10 bg-background/70 px-5 py-5 transition duration-300 hover:bg-white/[0.07] sm:grid-cols-[150px_1fr_auto]"
    >
      <img
        src={getObservatoryImage(site)}
        alt={site.name}
        className="h-36 w-full rounded-lg object-cover sm:h-28"
        loading="lazy"
      />
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-xl text-foreground transition group-hover:text-aurora">
            {site.name}
          </h3>
          {site.isFeatured ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] text-emerald-100">
              <Star className="h-3.5 w-3.5" />
              Featured
            </span>
          ) : null}
        </div>
        {!compact ? (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-foreground/60">
            {site.description}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-foreground/45">
          <span>{site.province}</span>
          <span>{site.type}</span>
          {site.elevation ? <span>{site.elevation}m</span> : null}
          {site.distanceKm ? <span>{site.distanceKm} km</span> : null}
        </div>
      </div>
      <div className="flex flex-row gap-2 text-sm text-foreground/65 sm:flex-col sm:items-end">
        <span>Sky {site.skyQualityScore ?? "--"}</span>
        <span>Light {site.lightPollutionScore ?? "--"}</span>
        {condition ? (
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-black">
            {condition.label} {condition.score}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

export default function LovableObservatory() {
  const [observatories, setObservatories] = useState([]);
  const [nearby, setNearby] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState("loading");
  const [nearbyStatus, setNearbyStatus] = useState("idle");
  const [filters, setFilters] = useState({
    search: "",
    province: "",
    country: "",
    type: "ALL",
    equipment: "",
    minSkyQuality: "",
    maxLightPollution: "",
  });

  const query = useMemo(() => {
    const params = { limit: 18 };
    if (filters.search.trim()) params.search = filters.search.trim();
    if (filters.province.trim()) params.province = filters.province.trim();
    if (filters.country.trim()) params.country = filters.country.trim();
    if (filters.equipment.trim()) params.equipment = filters.equipment.trim();
    if (filters.type !== "ALL") params.type = filters.type;
    if (filters.minSkyQuality) params.minSkyQuality = filters.minSkyQuality;
    if (filters.maxLightPollution) params.maxLightPollution = filters.maxLightPollution;
    return params;
  }, [filters]);

  useEffect(() => {
    let active = true;
    setStatus("loading");

    Promise.all([
      getObservatories(query),
      getObservatoryStats(query).catch(() => null),
    ])
      .then(([result, statsResult]) => {
        if (!active) return;
        setObservatories(result.observatories || []);
        setPagination(result.pagination || null);
        setStats(statsResult);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [query]);

  const featuredSites = observatories.filter((item) => item.isFeatured).slice(0, 4);
  const mapSite = nearby[0] || featuredSites[0] || observatories[0];
  const mapUrl = mapEmbedUrl(mapSite);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const loadNearby = () => {
    if (!navigator.geolocation) {
      setNearbyStatus("unsupported");
      return;
    }

    setNearbyStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        getNearbyObservatories({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          radius: 250,
        })
          .then((result) => {
            setNearby(result.results || []);
            setNearbyStatus("ready");
          })
          .catch(() => setNearbyStatus("error"));
      },
      () => setNearbyStatus("error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <PageShell
      eyebrow="Chapter III"
      title="Observatory"
      lead="Danh sach dai quan sat, diem ngam sao, thoi tiet va dieu kien quan sat duoc lay tu database."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total sites" value={stats?.total ?? pagination?.total} />
        <StatTile label="Featured" value={stats?.featured} />
        <StatTile label="Avg sky" value={stats?.averages?.skyQualityScore} />
        <StatTile label="Avg light" value={stats?.averages?.lightPollutionScore} />
      </div>

      <section className="mt-10">
        <div className="mb-6 max-w-3xl">
          <p className="font-display text-[11px] tracking-[0.34em] uppercase text-[#6ecbff]/70">Stargazing Planner</p>
          <h2 className="mt-4 font-display text-3xl font-light tracking-[-0.025em] text-foreground md:text-4xl">
            Plan a real observing session from this module.
          </h2>
          <p className="mt-4 text-sm font-light leading-relaxed text-foreground/60 md:text-base">
            The recommendation workflow belongs with observatories because it combines location, weather, visible targets, and nearby sites.
          </p>
        </div>
        <StargazingPlannerPanel />
      </section>

      <SectionPanel variant="table" className="mt-8 overflow-visible">
        <div className="grid gap-4 bg-background/70 p-5 lg:grid-cols-[1.3fr_0.9fr_0.9fr_1fr]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/35" />
            <input
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder="Search observatory"
              className="h-12 w-full border border-white/10 bg-black/25 pl-11 pr-4 text-base text-foreground outline-none transition focus:border-white/35"
            />
          </label>
          <input
            value={filters.province}
            onChange={(event) => updateFilter("province", event.target.value)}
            placeholder="Province"
            className="h-12 border border-white/10 bg-black/25 px-4 text-base text-foreground outline-none transition focus:border-white/35"
          />
          <input
            value={filters.country}
            onChange={(event) => updateFilter("country", event.target.value)}
            placeholder="Country"
            className="h-12 border border-white/10 bg-black/25 px-4 text-base text-foreground outline-none transition focus:border-white/35"
          />
          <input
            value={filters.equipment}
            onChange={(event) => updateFilter("equipment", event.target.value)}
            placeholder="Equipment"
            className="h-12 border border-white/10 bg-black/25 px-4 text-base text-foreground outline-none transition focus:border-white/35"
          />
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 bg-background/70 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="h-4 w-4 shrink-0 text-foreground/45" />
            {typeFilters.map((type) => {
              const active = filters.type === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => updateFilter("type", type.value)}
                  className={`rounded-full border px-4 py-2 text-sm uppercase tracking-[0.18em] transition duration-300 hover:scale-[1.04] ${
                    active
                      ? "border-white bg-white text-black"
                      : "border-white/10 bg-black/20 text-foreground/60 hover:border-white/30 hover:text-foreground"
                  }`}
                >
                  {type.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() =>
                setFilters({
                  search: "",
                  province: "",
                  country: "",
                  type: "ALL",
                  equipment: "",
                  minSkyQuality: "",
                  maxLightPollution: "",
                })
              }
              className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm uppercase tracking-[0.18em] text-foreground/60 transition duration-300 hover:scale-[1.04] hover:border-white/30 hover:text-foreground"
            >
              Reset
            </button>
          </div>

          <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:min-w-[270px]">
            <input
              value={filters.minSkyQuality}
              onChange={(event) => updateFilter("minSkyQuality", event.target.value)}
              type="number"
              min="0"
              max="100"
              placeholder="Min sky"
              className="h-10 min-w-0 border border-white/10 bg-black/25 px-3 text-sm text-foreground outline-none focus:border-white/35"
            />
            <input
              value={filters.maxLightPollution}
              onChange={(event) => updateFilter("maxLightPollution", event.target.value)}
              type="number"
              min="0"
              max="100"
              placeholder="Max light"
              className="h-10 min-w-0 border border-white/10 bg-black/25 px-3 text-sm text-foreground outline-none focus:border-white/35"
            />
          </div>
        </div>
      </SectionPanel>

      <div className="mt-10 grid gap-8 xl:grid-cols-[1fr_0.9fr]">
        <div>
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-xs uppercase tracking-[0.35em] text-foreground/40">Database Observatory List</h2>
            {pagination ? (
              <span className="text-xs uppercase tracking-[0.2em] text-foreground/35">
                {observatories.length}/{pagination.total}
              </span>
            ) : null}
          </div>

          {status === "loading" ? <p className="text-sm text-foreground/60">Loading observatories...</p> : null}
          {status === "error" ? <p className="text-sm text-red-200/80">Could not load observatories.</p> : null}

          <SectionPanel variant="table">
            <ol>
              {observatories.map((site) => (
                <li key={site.id}>
                  <ObservatoryCard site={site} />
                </li>
              ))}
            </ol>
          </SectionPanel>
        </div>

        <aside className="space-y-8">
          <section>
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-xs uppercase tracking-[0.35em] text-foreground/40">Nearby & Map</h2>
              <button
                type="button"
                onClick={loadNearby}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white px-4 py-2 text-sm font-medium text-black transition duration-300 hover:scale-[1.04]"
              >
                <LocateFixed className="h-4 w-4" />
                Near me
              </button>
            </div>

            <SectionPanel variant="table" className="overflow-hidden">
              {mapUrl ? (
                <iframe
                  title={mapSite?.name || "Observatory map"}
                  src={mapUrl}
                  className="h-72 w-full border-0"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-72 items-center justify-center text-sm text-foreground/50">
                  Map unavailable
                </div>
              )}
              {mapSite ? (
                <div className="flex items-start gap-3 border-t border-white/10 bg-background/75 px-5 py-4">
                  <MapPin className="mt-1 h-4 w-4 text-aurora" />
                  <div>
                    <div className="font-display text-lg text-foreground">{mapSite.name}</div>
                    <div className="text-sm text-foreground/55">{mapSite.address}, {mapSite.province}</div>
                  </div>
                </div>
              ) : null}
            </SectionPanel>

            {nearbyStatus === "loading" ? <p className="mt-4 text-sm text-foreground/60">Finding nearby sites...</p> : null}
            {nearbyStatus === "error" ? <p className="mt-4 text-sm text-red-200/80">Could not access location or nearby API.</p> : null}
            {nearbyStatus === "unsupported" ? <p className="mt-4 text-sm text-red-200/80">Browser does not support geolocation.</p> : null}
          </section>

          {nearby.length ? (
            <section>
              <h2 className="mb-5 text-xs uppercase tracking-[0.35em] text-foreground/40">Nearest Sites</h2>
              <SectionPanel variant="table">
                <ol>
                  {nearby.slice(0, 5).map((site) => (
                    <li key={site.id}>
                      <ObservatoryCard site={site} compact />
                    </li>
                  ))}
                </ol>
              </SectionPanel>
            </section>
          ) : (
            <section>
              <h2 className="mb-5 text-xs uppercase tracking-[0.35em] text-foreground/40">Featured Sites</h2>
              <SectionPanel variant="table">
                <ol>
                  {featuredSites.map((site) => (
                    <li key={site.id}>
                      <ObservatoryCard site={site} compact />
                    </li>
                  ))}
                </ol>
              </SectionPanel>
            </section>
          )}
        </aside>
      </div>
    </PageShell>
  );
}
