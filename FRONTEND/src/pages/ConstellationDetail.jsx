import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Compass,
  ExternalLink,
  Images,
  LocateFixed,
  Loader2,
  Minus,
  Orbit,
  Plus,
  RotateCcw,
  Sparkles,
  Star,
  Telescope,
} from "lucide-react";
import { ConstellationSketch } from "../components/lovable/ConstellationSketch";
import { AdminResourceActions } from "../components/admin/AdminResourceActions";
import { Starfield } from "../components/lovable/Starfield";
import { useAuth } from "../context/authState";
import { getCategory, getHemisphere, safeConstellationValue } from "../lib/constellations";
import {
  getConstellationAIContent,
  getConstellationBySlug,
  getConstellationGallery,
  getRelatedConstellations,
  refreshConstellationAIContent,
} from "../services/astronomy.api";

const MIN_SKETCH_ZOOM = 0.75;
const MAX_SKETCH_ZOOM = 2;
const DEFAULT_SKETCH_ZOOM = 1;
const SKETCH_ZOOM_STEP = 0.1;

function getTitleSizeClass(name = "") {
  const longestWord = String(name)
    .split(/[^A-Za-z0-9]+/)
    .reduce((longest, word) => Math.max(longest, word.length), 0);

  if (longestWord > 12) return "text-4xl md:text-5xl lg:text-6xl xl:text-7xl";
  if (longestWord > 7) return "text-5xl md:text-6xl lg:text-7xl xl:text-7xl";
  return "text-7xl md:text-8xl lg:text-9xl";
}

function clampZoom(value) {
  return Math.min(MAX_SKETCH_ZOOM, Math.max(MIN_SKETCH_ZOOM, Number(value)));
}

function InfoRow({ label, value }) {
  return (
    <div className="grid grid-cols-[10rem_1fr] gap-6 border-b border-white/12 py-5 last:border-b-0">
      <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">{label}</p>
      <p className="text-base font-semibold text-white">{safeConstellationValue(value)}</p>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="border-y border-white/12 py-6 md:border-r md:px-7 md:last:border-r-0">
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6ecbff]/72">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">{safeConstellationValue(value)}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <main className="relative min-h-screen bg-background pt-40 text-center text-white">
      <Starfield />
      <p className="relative z-10 text-sm uppercase tracking-[0.3em] text-slate-400">Loading constellation profile...</p>
    </main>
  );
}

function ErrorState({ message }) {
  return (
    <main className="relative min-h-screen bg-background px-6 pt-40 text-center text-white">
      <Starfield />
      <div className="relative z-10 mx-auto max-w-lg">
        <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-red-200/80">Profile unavailable</p>
        <h1 className="mt-4 font-display text-5xl font-light">Constellation not found</h1>
        <p className="mt-5 text-slate-300/72">{message}</p>
        <Link to="/constellations" className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white/82 transition hover:border-[#6ecbff]/45 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to database
        </Link>
      </div>
    </main>
  );
}

export default function ConstellationDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [constellation, setConstellation] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [sketchZoom, setSketchZoom] = useState(DEFAULT_SKETCH_ZOOM);
  const [gallery, setGallery] = useState({ images: [], wikiUrl: "" });
  const [galleryStatus, setGalleryStatus] = useState("idle");
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [aiContent, setAiContent] = useState(null);
  const [aiStatus, setAiStatus] = useState("idle");
  const [aiError, setAiError] = useState("");
  const [related, setRelated] = useState([]);
  const [relatedStatus, setRelatedStatus] = useState("idle");
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    let active = true;
    setStatus("loading");
    setError("");
    setSketchZoom(DEFAULT_SKETCH_ZOOM);

    getConstellationBySlug(slug)
      .then((item) => {
        if (!active) return;
        setConstellation(item);
        setStatus("ready");
      })
      .catch((err) => {
        if (!active) return;
        setError(err.response?.data?.message || err.message || "Could not load this constellation.");
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    let active = true;
    setGallery({ images: [], wikiUrl: "" });
    setGalleryIndex(0);
    setGalleryStatus("loading");

    getConstellationGallery(slug, { limit: 15 })
      .then((data) => {
        if (!active) return;
        setGallery({
          images: Array.isArray(data?.images) ? data.images : [],
          wikiUrl: data?.wikiUrl || "",
        });
        setGalleryStatus("ready");
      })
      .catch(() => {
        if (!active) return;
        setGalleryStatus("error");
      });

    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    let active = true;
    setAiContent(null);
    setAiStatus("loading");
    setAiError("");

    getConstellationAIContent(slug)
      .then((data) => {
        if (!active) return;
        setAiContent(data);
        setAiStatus("ready");
      })
      .catch((err) => {
        if (!active) return;
        setAiStatus("error");
        setAiError(err.response?.data?.message || err.message || "Could not load AI content.");
      });

    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    let active = true;
    setRelated([]);
    setRelatedStatus("loading");

    getRelatedConstellations(slug)
      .then((items) => {
        if (!active) return;
        setRelated(Array.isArray(items) ? items : []);
        setRelatedStatus("ready");
      })
      .catch(() => {
        if (active) setRelatedStatus("error");
      });

    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    const count = gallery.images.length;
    if (count <= 1) return undefined;

    function handleGalleryKeyDown(event) {
      const targetTag = event.target?.tagName?.toLowerCase();
      if (targetTag === "input" || targetTag === "textarea" || targetTag === "select") return;

      const key = event.key.toLowerCase();
      if (key === "a") {
        setGalleryIndex((value) => (value - 1 + count) % count);
      }
      if (key === "d") {
        setGalleryIndex((value) => (value + 1) % count);
      }
    }

    window.addEventListener("keydown", handleGalleryKeyDown);
    return () => window.removeEventListener("keydown", handleGalleryKeyDown);
  }, [gallery.images.length]);

  if (status === "loading") return <LoadingState />;
  if (status === "error" || !constellation) return <ErrorState message={error} />;

  const facts = aiContent?.facts?.length
    ? aiContent.facts
    : constellation.aiFacts?.length
    ? constellation.aiFacts
    : [
        `${constellation.name} is one of the 88 modern constellations recognized by the International Astronomical Union.`,
        `${constellation.abbreviation || constellation.name} is used as its catalog abbreviation.`,
        `${constellation.brightestStar || "Its brightest star"} helps observers orient the pattern in the sky.`,
      ];

  const story =
    aiContent?.mythology ||
    constellation.aiMythology ||
    constellation.mythologicalOrigin ||
    constellation.description ||
    `${constellation.name} is part of the modern celestial atlas and marks a named region of the sky.`;
  const observerTip =
    aiContent?.observerTip ||
    constellation.aiObserverTip ||
    `Look for ${constellation.name} around ${safeConstellationValue(constellation.bestMonth, "its best season")} and compare the surrounding stars with a sky map.`;
  const zoomPercent = Math.round(sketchZoom * 100);
  const titleSizeClass = getTitleSizeClass(constellation.name);
  const galleryImages = gallery.images;
  const currentGalleryImage = galleryImages[galleryIndex % Math.max(galleryImages.length, 1)];

  function updateSketchZoom(nextValue) {
    setSketchZoom((current) => clampZoom(typeof nextValue === "function" ? nextValue(current) : nextValue));
  }

  function handleSketchWheel(event) {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    updateSketchZoom((value) => value + direction * SKETCH_ZOOM_STEP);
  }

  function showPreviousGalleryImage() {
    setGalleryIndex((value) => (value - 1 + galleryImages.length) % galleryImages.length);
  }

  function showNextGalleryImage() {
    setGalleryIndex((value) => (value + 1) % galleryImages.length);
  }

  async function handleRefreshAIContent() {
    if (!isAdmin || aiStatus === "refreshing") return;
    setAiStatus("refreshing");
    setAiError("");

    try {
      const data = await refreshConstellationAIContent(slug);
      setAiContent(data);
      setAiStatus("ready");
    } catch (err) {
      setAiStatus("error");
      setAiError(err.response?.data?.message || err.message || "Could not refresh AI content.");
    }
  }

  function handleConstellationUpdated(updated) {
    setConstellation(updated);
    if (updated?.slug && updated.slug !== slug) navigate(`/constellations/${updated.slug}`, { replace: true });
  }

  function handleConstellationDeleted() {
    navigate("/constellations", { replace: true });
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-white">
      <Starfield />

      <section className="relative z-10 grid min-h-screen items-center gap-12 overflow-hidden px-6 pb-20 pt-32 md:px-12 lg:grid-cols-[minmax(0,0.76fr)_minmax(520px,1fr)] lg:px-16 xl:gap-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_36%,rgba(110,203,255,0.16),transparent_30%),radial-gradient(circle_at_24%_40%,rgba(87,42,145,0.18),transparent_36%),linear-gradient(180deg,rgba(2,7,18,0.08),#020712_92%)]" />

        <div className="relative z-10 min-w-0 max-w-xl">
          <Link to="/constellations" className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.035] px-4 py-2 text-xs uppercase tracking-[0.22em] text-slate-200/78 transition hover:border-[#6ecbff]/45 hover:bg-[#6ecbff]/10 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Database
          </Link>
          <p className="mt-14 text-[11px] font-bold uppercase tracking-[0.48em] text-[#6ecbff]/72">
            {getCategory(constellation)} / {getHemisphere(constellation)}
          </p>
          <h1 className={`mt-4 max-w-full break-normal font-display font-light uppercase leading-[0.9] tracking-[0.02em] text-white ${titleSizeClass}`}>
            {constellation.name}
          </h1>
          <div className="mt-8 h-px w-28 bg-[#6ecbff]/80 shadow-[0_0_18px_rgba(110,203,255,0.55)]" />
          <p className="mt-8 max-w-xl text-lg font-light leading-9 text-slate-200/76">
            {constellation.description}
          </p>
          {isAdmin ? (
            <div className="mt-8">
              <AdminResourceActions
                resourceName="constellation"
                endpoint="/astronomy/constellations"
                slug={constellation.slug}
                item={constellation}
                onUpdated={handleConstellationUpdated}
                onDeleted={handleConstellationDeleted}
              />
            </div>
          ) : null}
        </div>

        <div
          className="relative z-10 mt-14 h-[440px] min-w-0 overflow-hidden md:h-[520px] lg:mt-0 lg:h-[620px]"
          onWheel={handleSketchWheel}
          aria-label="Constellation preview. Use mouse wheel to zoom."
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(111,48,183,0.18),transparent_44%)]" />
          <div
            className="absolute inset-8 origin-center transition-transform duration-300 ease-out md:inset-10"
            style={{ transform: `scale(${sketchZoom})` }}
          >
            <ConstellationSketch constellation={constellation} className="drop-shadow-[0_0_28px_rgba(110,203,255,0.22)]" />
          </div>
          <div className="absolute right-5 top-5 flex max-w-[calc(100%-2.5rem)] items-center gap-2 rounded-full border border-white/12 bg-black/35 px-3 py-2 backdrop-blur-md">
            <button
              type="button"
              onClick={() => updateSketchZoom((value) => value - SKETCH_ZOOM_STEP)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-slate-200 transition hover:border-[#6ecbff]/45 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              disabled={sketchZoom <= MIN_SKETCH_ZOOM}
              aria-label="Zoom out"
              title="Zoom out"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="range"
              min={MIN_SKETCH_ZOOM}
              max={MAX_SKETCH_ZOOM}
              step={SKETCH_ZOOM_STEP}
              value={sketchZoom}
              onChange={(event) => updateSketchZoom(event.target.value)}
              className="h-9 w-28 accent-[#6ecbff]"
              aria-label="Constellation zoom"
            />
            <button
              type="button"
              onClick={() => updateSketchZoom((value) => value + SKETCH_ZOOM_STEP)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-slate-200 transition hover:border-[#6ecbff]/45 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              disabled={sketchZoom >= MAX_SKETCH_ZOOM}
              aria-label="Zoom in"
              title="Zoom in"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => updateSketchZoom(DEFAULT_SKETCH_ZOOM)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-slate-200 transition hover:border-[#6ecbff]/45 hover:text-white"
              aria-label="Reset zoom"
              title="Reset zoom"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <span className="min-w-12 text-center text-xs font-bold text-[#9bd5ff]">{zoomPercent}%</span>
          </div>
          <p className="absolute bottom-8 right-6 text-[11px] font-bold uppercase tracking-[0.46em] text-[#6ecbff]/60">
            {safeConstellationValue(constellation.quadrant, "Sky Atlas")}
          </p>
        </div>
      </section>

      <section className="relative z-10 border-y border-white/12 px-6 md:px-12 lg:px-16">
        <div className="mx-auto grid max-w-7xl md:grid-cols-4">
          <Stat label="Abbrev." value={constellation.abbreviation} />
          <Stat label="Season" value={constellation.bestSeason} />
          <Stat label="Brightest" value={constellation.brightestStar} />
          <Stat label="Family" value={constellation.family} />
        </div>
      </section>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-20 px-6 py-24 md:px-12 lg:grid-cols-[0.8fr_1.2fr] lg:px-16">
        <header>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.36em] text-[#6ecbff]/72">Mission Story</p>
            <span className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.035] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
              <Sparkles className="h-3.5 w-3.5 text-[#9bd5ff]" />
              {aiStatus === "loading" ? "AI loading" : aiContent?.source || "profile"}
            </span>
          </div>
          <h2 className="mt-4 font-display text-5xl font-semibold uppercase tracking-[-0.04em] text-white md:text-7xl">
            Story written in stars.
          </h2>
          {isAdmin ? (
            <button
              type="button"
              onClick={handleRefreshAIContent}
              disabled={aiStatus === "refreshing"}
              className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#6ecbff]/35 bg-[#6ecbff]/10 px-5 text-sm font-semibold text-[#c8f1ff] transition hover:border-[#9ee8ff]/70 hover:bg-[#6ecbff]/16 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {aiStatus === "refreshing" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Refresh AI
            </button>
          ) : null}
          {aiError ? <p className="mt-4 text-sm text-red-200">{aiError}</p> : null}
        </header>
        <div>
          <p className="text-xl font-light leading-10 text-slate-200/78">{story}</p>
          <div className="mt-12 border-y border-white/12">
            {facts.map((fact, index) => (
              <article key={`${fact}-${index}`} className="grid gap-5 border-b border-white/12 py-7 last:border-b-0 md:grid-cols-[7rem_1fr]">
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">{String(index + 1).padStart(2, "0")}</p>
                <p className="text-lg leading-9 text-slate-300/82">{fact}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 border-t border-white/10 px-6 py-24 md:px-12 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.36em] text-[#6ecbff]/72">Sky Position</p>
            <h2 className="mt-4 font-display text-5xl font-semibold uppercase tracking-[-0.04em] text-white md:text-7xl">
              Where to find it.
            </h2>
            <div className="mt-10 border-y border-white/12">
              <InfoRow label="Quadrant" value={constellation.quadrant} />
              <InfoRow label="Hemisphere" value={getHemisphere(constellation)} />
              <InfoRow label="Visible Lat." value={constellation.visibleLatitudes} />
              <InfoRow label="Right Asc." value={constellation.rightAscension} />
              <InfoRow label="Declination" value={constellation.declination} />
              <InfoRow label="Area" value={constellation.areaSqDeg ? `${constellation.areaSqDeg} sq deg` : null} />
            </div>
          </div>

          <aside className="grid content-start gap-6">
            <div className="border border-white/12 bg-white/[0.03] p-7">
              <div className="flex items-center gap-3 text-[#9bd5ff]">
                <Telescope className="h-5 w-5" />
              <p className="text-[11px] font-bold uppercase tracking-[0.34em]">Observer Tip</p>
              </div>
              <p className="mt-6 text-lg leading-9 text-slate-300/82">
                {observerTip}
              </p>
            </div>
            <div className="grid gap-px overflow-hidden border border-white/12 bg-white/12">
              <Metric icon={Star} label="Brightest Star" value={constellation.brightestStar} />
              <Metric icon={Orbit} label="Best Month" value={constellation.bestMonth} />
              <Metric icon={Compass} label="Category" value={getCategory(constellation)} />
              <Metric icon={LocateFixed} label="Latin Name" value={constellation.latinName} />
            </div>
          </aside>
        </div>
      </section>

      <section className="relative z-10 border-t border-white/10 px-6 py-24 md:px-12 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <header>
              <p className="text-[11px] font-bold uppercase tracking-[0.36em] text-[#6ecbff]/72">Related Patterns</p>
              <h2 className="mt-4 font-display text-5xl font-semibold uppercase tracking-[-0.04em] text-white md:text-7xl">
                Nearby in the catalog.
              </h2>
            </header>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {relatedStatus === "loading" ? "Loading" : `${related.length} matches`}
            </p>
          </div>

          {related.length ? (
            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  to={`/constellations/${item.slug}`}
                  className="group border border-white/10 bg-white/[0.025] p-5 transition hover:-translate-y-1 hover:border-[#6ecbff]/45 hover:bg-[#6ecbff]/10"
                >
                  <div className="h-36 overflow-hidden bg-[#050611] p-4">
                    <ConstellationSketch constellation={item} compact className="transition duration-500 group-hover:scale-105" />
                  </div>
                  <p className="mt-5 text-xl font-semibold text-white">{item.name}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                    {item.family || "Constellation"} / {item.abbreviation || "IAU"}
                  </p>
                </Link>
              ))}
            </div>
          ) : relatedStatus === "loading" ? (
            <div className="mt-12 grid h-40 place-items-center border-y border-white/10 text-sm uppercase tracking-[0.3em] text-slate-500">
              Loading related constellations...
            </div>
          ) : null}
        </div>
      </section>

      <section className="relative z-10 border-t border-white/10 px-6 py-24 md:px-12 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <header>
              <p className="text-[11px] font-bold uppercase tracking-[0.36em] text-[#6ecbff]/72">Visual Archive</p>
              <h2 className="mt-4 font-display text-5xl font-semibold uppercase tracking-[-0.04em] text-white md:text-7xl">
                {constellation.name} gallery.
              </h2>
            </header>
            {gallery.wikiUrl ? (
              <a
                href={gallery.wikiUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#6ecbff]/35 bg-[#6ecbff]/10 px-5 text-sm font-semibold text-[#c8f1ff] transition hover:border-[#9ee8ff]/70 hover:bg-[#6ecbff]/16"
              >
                <ExternalLink className="h-4 w-4" />
                Wiki
              </a>
            ) : null}
          </div>

          {galleryStatus === "loading" ? (
            <div className="mt-12 grid h-96 place-items-center border-y border-white/10 text-sm uppercase tracking-[0.3em] text-slate-500">
              Loading images...
            </div>
          ) : null}

          {galleryStatus !== "loading" && currentGalleryImage ? (
            <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
              <div className="relative min-h-[28rem] overflow-hidden border-y border-white/12 bg-[#020712]/40">
                <img
                  src={currentGalleryImage.url}
                  alt={currentGalleryImage.title || `${constellation.name} gallery image`}
                  className="h-[28rem] w-full object-contain md:h-[34rem]"
                  loading="lazy"
                />
                {galleryImages.length > 1 ? (
                  <div className="absolute inset-x-5 top-1/2 flex -translate-y-1/2 items-center justify-between">
                    <button
                      type="button"
                      onClick={showPreviousGalleryImage}
                      className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/45 text-slate-100 backdrop-blur-md transition hover:border-[#6ecbff]/50 hover:text-white"
                      aria-label="Previous constellation image"
                      title="Previous image"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={showNextGalleryImage}
                      className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/45 text-slate-100 backdrop-blur-md transition hover:border-[#6ecbff]/50 hover:text-white"
                      aria-label="Next constellation image"
                      title="Next image"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                ) : null}
                <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-center justify-between gap-3 bg-black/45 px-4 py-3 backdrop-blur-md">
                  <p className="min-w-0 truncate text-sm font-semibold text-white">
                    {currentGalleryImage.title || constellation.name}
                  </p>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9bd5ff]">
                    {galleryIndex + 1} / {galleryImages.length}
                  </p>
                </div>
              </div>

              <div className="grid content-start gap-3">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4 text-[#9bd5ff]">
                  <Images className="h-5 w-5" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.32em]">Frames</p>
                </div>
                <div className="grid max-h-[34rem] gap-3 overflow-y-auto pr-1">
                  {galleryImages.map((image, index) => (
                    <button
                      key={`${image.url}-${index}`}
                      type="button"
                      onClick={() => setGalleryIndex(index)}
                      className={[
                        "grid grid-cols-[4.5rem_1fr] gap-3 border p-2 text-left transition",
                        index === galleryIndex
                          ? "border-[#6ecbff]/55 bg-[#6ecbff]/10"
                          : "border-white/10 bg-white/[0.025] hover:border-[#6ecbff]/35",
                      ].join(" ")}
                    >
                      <img
                        src={image.url}
                        alt={image.title || `${constellation.name} thumbnail ${index + 1}`}
                        className="h-16 w-full object-cover"
                        loading="lazy"
                      />
                      <span className="min-w-0 self-center">
                        <span className="block truncate text-sm font-semibold text-white">{image.title || constellation.name}</span>
                        <span className="mt-1 block truncate text-xs text-slate-500">{image.source || "Gallery"}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {galleryStatus !== "loading" && !currentGalleryImage ? (
            <div className="mt-12 grid min-h-64 place-items-center border-y border-white/10 px-6 text-center">
              <p className="max-w-xl text-base leading-8 text-slate-400">
                No gallery images are available for this constellation yet.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="bg-[#08101d]/95 p-5">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-[#6ecbff]" />
        <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-500">{label}</p>
      </div>
      <p className="mt-3 text-lg font-semibold text-white">{safeConstellationValue(value)}</p>
    </div>
  );
}
