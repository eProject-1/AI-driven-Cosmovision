import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Filter, LocateFixed, MapPin } from "lucide-react";
import { AdminResourceActions } from "../components/admin/AdminResourceActions";
import { FilterPill } from "../components/common/FilterControls";
import { Pagination } from "../components/common/Pagination";
import { SearchField } from "../components/common/SearchField";
import { PageShell } from "../components/lovable/PageShell";
import { SectionPanel } from "../components/lovable/Framing";
import { useAuth } from "../context/authState";
import {
  getNearbyObservatories,
  getObservatories,
  getObservatoryStats,
} from "../services/observatory.api";
import { getDefaultObservatoryImage, getObservatoryImage } from "../utils/observatoryImages";
import { StargazingPlannerPanel } from "./StargazingPlanner";

const typeFilters = [
  { value: "ALL", label: "All" },
  { value: "PUBLIC", label: "Public Observatory" },
  { value: "PRIVATE", label: "Research Observatory" },
  { value: "STARGAZING_SITE", label: "Stargazing Site" },
];
const observatoryCreateTemplate = {
  name: "New Observatory",
  slug: "new-observatory",
  description: "Write a clear observatory description.",
  country: "Vietnam",
  province: "Hanoi",
  address: "Hanoi, Vietnam",
  type: "PUBLIC",
  latitude: 21.0278,
  longitude: 105.8342,
};

function mapEmbedUrl(site) {
  if (!site?.latitude || !site?.longitude) return null;
  const lat = Number(site.latitude);
  const lon = Number(site.longitude);
  return `https://maps.google.com/maps?q=${lat},${lon}&z=9&output=embed`;
}

function typeLabel(value) {
  if (value === "PUBLIC") return "Public observatory";
  if (value === "PRIVATE") return "Research observatory";
  if (value === "STARGAZING_SITE") return "Stargazing site";
  return value;
}

function StatTile({ label, value }) {
  return (
    <div className="border border-white/10 bg-background/70 px-4 py-4">
      <div className="text-[11px] uppercase tracking-[0.25em] text-foreground/40">{label}</div>
      <div className="mt-2 font-display text-3xl text-foreground">{value ?? "--"}</div>
    </div>
  );
}

function ObservatoryCard({ site, compact = false, onPreview, adminActions }) {
  const cardLayout = compact
    ? "grid gap-4 sm:grid-cols-[120px_1fr_auto]"
    : "flex h-[420px] flex-col overflow-hidden";
  const imageClass = compact
    ? "h-32 w-full object-cover sm:h-24"
    : "h-[235px] w-full object-cover";

  return (
    <article className="border border-white/10 bg-background/70">
      <Link
        to={`/observatory/${site.slug}`}
        onMouseEnter={() => onPreview?.(site)}
        onFocus={() => onPreview?.(site)}
        className={`group transition duration-300 hover:-translate-y-0.5 hover:border-aurora/40 hover:bg-white/[0.08] hover:shadow-[0_18px_60px_rgba(67,177,255,0.13)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-aurora/70 ${cardLayout}`}
      >
        <img
          src={getObservatoryImage(site)}
          alt={site.name}
          className={imageClass}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = getDefaultObservatoryImage();
          }}
        />
        <div className="flex flex-1 flex-col px-5 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-xl text-foreground transition group-hover:text-aurora">
              {site.name}
            </h3>
          </div>
          {!compact ? (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-foreground/60">
              {site.description}
            </p>
          ) : null}
          <div className="mt-auto flex flex-wrap gap-2 pt-4 text-[11px] uppercase tracking-[0.18em] text-foreground/45">
            <span>{site.province}</span>
            <span>{typeLabel(site.type)}</span>
            {site.elevation ? <span>{site.elevation}m</span> : null}
            {site.distanceKm ? <span>{site.distanceKm} km</span> : null}
          </div>
        </div>
      </Link>
      {adminActions ? <div className="border-t border-white/10 p-4">{adminActions}</div> : null}
    </article>
  );
}

export default function LovableObservatory() {
  const { user } = useAuth();
  const [observatories, setObservatories] = useState([]);
  const [nearby, setNearby] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [previewSite, setPreviewSite] = useState(null);
  const listTopRef = useRef(null);
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
  const isAdmin = user?.role === "ADMIN";

  const query = useMemo(() => {
    const params = { page, limit: 10 };
    if (filters.search.trim()) params.search = filters.search.trim();
    if (filters.province.trim()) params.province = filters.province.trim();
    if (filters.country.trim()) params.country = filters.country.trim();
    if (filters.equipment.trim()) params.equipment = filters.equipment.trim();
    if (filters.type !== "ALL") params.type = filters.type;
    if (filters.minSkyQuality) params.minSkyQuality = filters.minSkyQuality;
    if (filters.maxLightPollution) params.maxLightPollution = filters.maxLightPollution;
    return params;
  }, [filters, page]);

  const loadObservatories = () => {
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
        setPreviewSite((current) => current || result.observatories?.[0] || null);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });

    return () => {
      active = false;
    };
  };

  useEffect(loadObservatories, [query]);

  const mapSite = previewSite || nearby[0] || observatories[0];
  const mapUrl = mapEmbedUrl(mapSite);
  const firstColumnCount = Math.ceil(observatories.length / 2);
  const leftObservatories = observatories.slice(0, firstColumnCount);
  const rightObservatories = observatories.slice(firstColumnCount);

  const scrollToObservatoryList = () => {
    window.setTimeout(() => {
      listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const goToPage = (nextPage) => {
    setPage(nextPage);
    setPreviewSite(null);
    scrollToObservatoryList();
  };

  const updateFilter = (key, value) => {
    setPage(1);
    setPreviewSite(null);
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
      title="Observatory"
      lead="A database-backed catalog of observatories, stargazing sites, weather, and observing conditions."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total sites" value={stats?.total ?? pagination?.total} />
        <StatTile label="Avg elevation" value={stats?.averages?.elevation ? `${stats.averages.elevation}m` : null} />
        <StatTile label="Avg sky" value={stats?.averages?.skyQualityScore} />
        <StatTile label="Avg light" value={stats?.averages?.lightPollutionScore} />
      </div>
      {isAdmin ? (
        <div className="mt-6">
          <AdminResourceActions
            resourceName="observatory"
            endpoint="/observatory"
            createTemplate={observatoryCreateTemplate}
            onCreated={loadObservatories}
          />
        </div>
      ) : null}

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
          <SearchField
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
            placeholder="Search observatory"
            inputClassName="h-12 pl-11 focus:border-white/35"
            iconClassName="h-4 w-4"
          />
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

        <div className="flex flex-col gap-4 border-t border-white/10 bg-background/70 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <Filter className="h-4 w-4 shrink-0 text-foreground/45" />
            {typeFilters.map((type) => (
              <FilterPill
                key={type.value}
                active={filters.type === type.value}
                onClick={() => updateFilter("type", type.value)}
                className="min-h-10 whitespace-nowrap px-4 text-[11px] tracking-[0.18em] sm:px-5"
                activeClassName="border-white bg-white text-black"
                inactiveClassName="border-white/10 bg-black/20 text-foreground/60 hover:border-white/30 hover:text-foreground"
              >
                {type.label}
              </FilterPill>
            ))}
          </div>

          <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:min-w-[270px] lg:shrink-0">
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

      <section ref={listTopRef} className="mt-8 scroll-mt-24">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="text-xs uppercase tracking-[0.35em] text-foreground/40">Database Observatory List</h2>
          {pagination ? (
            <span className="text-xs uppercase tracking-[0.2em] text-foreground/35">
              Page {pagination.page}/{pagination.totalPages || 1} - {observatories.length}/{pagination.total}
            </span>
          ) : null}
        </div>

        {pagination && pagination.totalPages > 1 ? (
          <Pagination
            className="mb-10 mt-6"
            page={pagination.page || page}
            totalPages={pagination.totalPages || 1}
            disabled={status === "loading"}
            onPageChange={goToPage}
          />
        ) : null}

        {status === "loading" ? <p className="text-sm text-foreground/60">Loading observatories...</p> : null}
        {status === "error" ? <p className="text-sm text-red-200/80">Could not load observatories.</p> : null}

        <div className="grid items-start gap-8 xl:grid-cols-2">
          <ol className="grid content-start gap-4">
            {leftObservatories.map((site) => (
              <li key={site.id}>
                <ObservatoryCard
                  site={site}
                  onPreview={setPreviewSite}
                  adminActions={
                    isAdmin ? (
                      <AdminResourceActions
                        resourceName="observatory"
                        endpoint="/observatory"
                        slug={site.slug}
                        item={site}
                        onUpdated={loadObservatories}
                        onDeleted={loadObservatories}
                      />
                    ) : null
                  }
                />
              </li>
            ))}
          </ol>

          <div className="grid content-start gap-4">
            <section className="flex h-[420px] flex-col">
              <div className="mb-3 flex h-10 shrink-0 items-center justify-between gap-4">
                <h2 className="text-xs uppercase tracking-[0.35em] text-foreground/40">Nearby & Map</h2>
                <button
                  type="button"
                  onClick={loadNearby}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 bg-white px-4 text-sm font-medium text-black transition duration-300 hover:scale-[1.04]"
                >
                  <LocateFixed className="h-4 w-4" />
                  Near me
                </button>
              </div>

              <SectionPanel variant="table" className="min-h-0 flex-1 overflow-hidden">
                {mapUrl ? (
                  <iframe
                    title={mapSite?.name || "Observatory map"}
                    src={mapUrl}
                    className="h-[250px] w-full border-0"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-[250px] items-center justify-center text-sm text-foreground/50">
                    Map unavailable
                  </div>
                )}
                {mapSite ? (
                  <div className="flex min-h-[116px] items-start gap-3 border-t border-white/10 bg-background/75 px-5 py-4">
                    <MapPin className="mt-1 h-4 w-4 text-aurora" />
                    <div className="min-w-0">
                      <div className="font-display text-lg text-foreground">{mapSite.name}</div>
                      <div className="line-clamp-2 text-sm text-foreground/55">{mapSite.address}, {mapSite.province}</div>
                    </div>
                  </div>
                ) : null}
              </SectionPanel>

              {nearbyStatus === "loading" ? <p className="mt-4 text-sm text-foreground/60">Finding nearby sites...</p> : null}
              {nearbyStatus === "error" ? <p className="mt-4 text-sm text-red-200/80">Could not access location or nearby API.</p> : null}
              {nearbyStatus === "unsupported" ? <p className="mt-4 text-sm text-red-200/80">Browser does not support geolocation.</p> : null}
            </section>

            <ol className="grid content-start gap-4">
              {rightObservatories.map((site) => (
                <li key={site.id}>
                  <ObservatoryCard
                    site={site}
                    onPreview={setPreviewSite}
                    adminActions={
                      isAdmin ? (
                        <AdminResourceActions
                          resourceName="observatory"
                          endpoint="/observatory"
                          slug={site.slug}
                          item={site}
                          onUpdated={loadObservatories}
                          onDeleted={loadObservatories}
                        />
                      ) : null
                    }
                  />
                </li>
              ))}
            </ol>
          </div>
        </div>

        {pagination && pagination.totalPages > 1 ? (
          <Pagination
            className="mt-10"
            page={pagination.page || page}
            totalPages={pagination.totalPages || 1}
            disabled={status === "loading"}
            onPageChange={goToPage}
          />
        ) : null}
      </section>
    </PageShell>
  );
}
