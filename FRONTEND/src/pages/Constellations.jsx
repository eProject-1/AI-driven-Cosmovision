import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  History,
  ImageUp,
  Loader2,
  LogIn,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AdminResourceActions } from "../components/admin/AdminResourceActions";
import { FilterGroup } from "../components/common/FilterControls";
import { Pagination } from "../components/common/Pagination";
import { SearchField } from "../components/common/SearchField";
import { ConstellationSketch } from "../components/lovable/ConstellationSketch";
import { Starfield } from "../components/lovable/Starfield";
import { useAuth } from "../context/authState";
import { getCategory, getHemisphere } from "../lib/constellations";
import {
  deleteConstellationUpload,
  getConstellations,
  getConstellationsByMonth,
  getMyConstellationUploads,
  recognizeConstellationImage,
} from "../services/astronomy.api";

const categories = ["All", "Animals", "Objects", "Mythology", "Human"];
const hemispheres = ["All", "Northern", "Southern", "Equatorial"];
const seasons = ["All", "Spring", "Summer", "Autumn", "Winter", "All year"];
const alphabet = ["All", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
const PAGE_SIZE = 20;

const constellationCreateTemplate = {
  name: "New Constellation",
  slug: "new-constellation",
  latinName: "New Constellation",
  abbreviation: "New",
  family: "Modern",
  quadrant: "NQ1",
  rightAscension: "0h 00m",
  declination: "+0 deg",
  areaSqDeg: 0,
  visibleLatitudes: "+90 deg to -90 deg",
  mainStars: 0,
  brightestStar: "",
  bestMonth: "January",
  bestSeason: "Winter",
  imageUrl: "",
  mapUrl: "",
  description: "Write a short constellation description.",
  mythologicalOrigin: "",
  aiMythology: "",
  aiFacts: [],
  aiObserverTip: "",
  isVisible: true,
};

function getErrorMessage(error) {
  return error?.response?.data?.message || error?.message || "Recognition failed.";
}

function formatConfidence(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0%";
  return `${Math.round(numeric * 100)}%`;
}

function normalizeSearchValue(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function getSearchScore(constellation, normalizedQuery) {
  if (!normalizedQuery) return 1;

  const fields = [
    constellation.name,
    constellation.latinName,
    constellation.abbreviation,
    constellation.brightestStar,
    constellation.family,
    constellation.description,
  ].map(normalizeSearchValue);

  if (fields.some((field) => field === normalizedQuery)) return 1000;
  if (fields.some((field) => field.startsWith(normalizedQuery))) return 820;
  if (fields.some((field) => field.includes(normalizedQuery))) return 520;
  return 0;
}

function Metric({ label, value }) {
  return (
    <div className="border border-white/10 bg-slate-950/40 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

export default function LovableConstellations() {
  const { user, loading: authLoading } = useAuth();
  const [constellations, setConstellations] = useState([]);
  const [status, setStatus] = useState("loading");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [hemisphere, setHemisphere] = useState("All");
  const [season, setSeason] = useState("All");
  const [letter, setLetter] = useState("All");
  const [alphabetExpanded, setAlphabetExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [hint, setHint] = useState("");
  const [recognitionStatus, setRecognitionStatus] = useState("idle");
  const [recognitionResult, setRecognitionResult] = useState(null);
  const [recognitionError, setRecognitionError] = useState("");
  const [uploads, setUploads] = useState([]);
  const [uploadsStatus, setUploadsStatus] = useState("idle");
  const [uploadsError, setUploadsError] = useState("");
  const [deletingUploadId, setDeletingUploadId] = useState("");
  const [monthlyConstellations, setMonthlyConstellations] = useState([]);
  const [monthlyStatus, setMonthlyStatus] = useState("idle");
  const currentMonth = new Date().getMonth() + 1;
  const isAdmin = user?.role === "ADMIN";

  const loadConstellations = () => {
    let active = true;

    getConstellations()
      .then((items) => {
        if (!active) return;
        setConstellations(items);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });

    return () => {
      active = false;
    };
  };

  useEffect(loadConstellations, []);

  useEffect(() => {
    let active = true;
    setMonthlyStatus("loading");

    getConstellationsByMonth(currentMonth)
      .then((items) => {
        if (!active) return;
        setMonthlyConstellations(items);
        setMonthlyStatus("ready");
      })
      .catch(() => {
        if (active) setMonthlyStatus("error");
      });

    return () => {
      active = false;
    };
  }, [currentMonth]);

  useEffect(() => {
    if (!selectedImage) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedImage);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedImage]);

  useEffect(() => {
    if (!user) {
      setUploads([]);
      setUploadsStatus("idle");
      return;
    }

    let active = true;
    setUploadsStatus("loading");
    setUploadsError("");

    getMyConstellationUploads({ limit: 5 })
      .then((items) => {
        if (!active) return;
        setUploads(items);
        setUploadsStatus("ready");
      })
      .catch((error) => {
        if (!active) return;
        setUploadsError(getErrorMessage(error));
        setUploadsStatus("error");
      });

    return () => {
      active = false;
    };
  }, [user]);

  const filteredConstellations = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(query);

    return constellations
      .map((constellation) => ({
        constellation,
        score: getSearchScore(constellation, normalizedQuery),
      }))
      .filter(({ constellation, score }) => {
        if (normalizedQuery && score <= 0) return false;
        if (category !== "All" && getCategory(constellation) !== category) return false;
        if (hemisphere !== "All" && getHemisphere(constellation) !== hemisphere) return false;
        if (season !== "All" && constellation.bestSeason !== season) return false;
        if (letter !== "All" && !constellation.name?.toUpperCase().startsWith(letter)) return false;
        return true;
      })
      .sort((left, right) => {
        if (normalizedQuery && left.score !== right.score) return right.score - left.score;
        return left.constellation.name.localeCompare(right.constellation.name);
      })
      .map(({ constellation }) => constellation);
  }, [category, constellations, hemisphere, letter, query, season]);

  const pageCount = Math.max(1, Math.ceil(filteredConstellations.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paginatedConstellations = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredConstellations.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredConstellations]);
  const pageStart = filteredConstellations.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const pageEnd = Math.min(currentPage * PAGE_SIZE, filteredConstellations.length);

  useEffect(() => {
    setPage(1);
  }, [category, hemisphere, letter, query, season]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const recognition = recognitionResult?.recognition;
  const recognizedConstellation = recognition?.constellation;
  const isRecognizing = recognitionStatus === "loading";
  const canSubmit = Boolean(user && selectedImage && !isRecognizing);
  const uploadLabel = selectedImage ? selectedImage.name : "Night-sky image";

  function clearSelection() {
    setSelectedImage(null);
    setRecognitionResult(null);
    setRecognitionError("");
    setRecognitionStatus("idle");
  }

  async function handleRecognize(event) {
    event.preventDefault();
    if (!selectedImage || !user) return;

    setRecognitionStatus("loading");
    setRecognitionError("");

    try {
      const result = await recognizeConstellationImage({ image: selectedImage, hint });
      setRecognitionResult(result);
      setRecognitionStatus("ready");

      const latestUploads = await getMyConstellationUploads({ limit: 5 });
      setUploads(latestUploads);
      setUploadsStatus("ready");
      setUploadsError("");
    } catch (error) {
      setRecognitionError(getErrorMessage(error));
      setRecognitionStatus("error");
    }
  }

  async function handleDeleteUpload(uploadId) {
    if (!uploadId || deletingUploadId) return;
    const shouldDelete = window.confirm("Delete this scan from your history?");
    if (!shouldDelete) return;

    const previousUploads = uploads;
    setDeletingUploadId(uploadId);
    setUploadsError("");
    setUploads((items) => items.filter((item) => item.id !== uploadId));

    try {
      await deleteConstellationUpload(uploadId);
    } catch (error) {
      setUploads(previousUploads);
      setUploadsError(getErrorMessage(error));
    } finally {
      setDeletingUploadId("");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <Starfield />

      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-12 pt-32 sm:px-6 md:px-14 md:pb-16 md:pt-40">
        <h1 className="break-words font-display text-4xl font-light leading-tight tracking-tight text-white sm:text-5xl md:text-7xl">
          Constellation
        </h1>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-0 sm:px-6 md:px-10 lg:px-14">
        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-[0_24px_100px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:rounded-3xl sm:p-6 md:p-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-cyan-200/12 bg-cyan-200/[0.045] px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-cyan-200/20 bg-cyan-200/10 text-cyan-100">
                <Sparkles size={18} />
              </span>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-cyan-100 sm:tracking-[0.24em]">AI Recognition Constellation</p>
                <p className="mt-1 text-sm text-slate-400">Upload a sky image and compare it with the constellation catalog.</p>
              </div>
            </div>
            <a
              href="#ai-recognition"
              className="inline-flex min-h-10 items-center rounded-full border border-cyan-200/25 bg-cyan-200/10 px-4 text-sm font-semibold text-cyan-50 transition hover:border-cyan-100/50 hover:bg-cyan-200/16"
            >
              Open scanner
            </a>
          </div>

          {isAdmin ? (
            <div className="mb-5 rounded-2xl border border-emerald-200/15 bg-emerald-300/[0.045] px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-100">Admin catalog</p>
                  <p className="mt-1 text-sm text-slate-400">Create, edit, and hide constellation records.</p>
                </div>
                <AdminResourceActions
                  resourceName="constellation"
                  endpoint="/astronomy/constellations"
                  createTemplate={constellationCreateTemplate}
                  onCreated={loadConstellations}
                />
              </div>
            </div>
          ) : null}

          <SearchField
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search 88 constellations... try Lyra"
            inputClassName="min-h-14 rounded-2xl bg-[#060812]/72 pl-14 pr-5 text-white placeholder:text-slate-500 focus:border-[#6ecbff]/55"
            iconClassName="left-5 text-[#9bd5ff]/70"
          />

          <div className="mt-7 grid gap-5">
            <FilterGroup label="Category" options={categories} value={category} onChange={setCategory} buttonClassName="min-h-8 px-3 normal-case tracking-normal" activeClassName="border-[#6ecbff]/55 bg-[#6ecbff]/16 text-[#9ee8ff]" inactiveClassName="border-white/10 bg-white/[0.025] text-slate-400 hover:border-[#6ecbff]/35 hover:text-white" />
            <FilterGroup label="Hemisphere" options={hemispheres} value={hemisphere} onChange={setHemisphere} buttonClassName="min-h-8 px-3 normal-case tracking-normal" activeClassName="border-[#6ecbff]/55 bg-[#6ecbff]/16 text-[#9ee8ff]" inactiveClassName="border-white/10 bg-white/[0.025] text-slate-400 hover:border-[#6ecbff]/35 hover:text-white" />
            <FilterGroup label="Season" options={seasons} value={season} onChange={setSeason} buttonClassName="min-h-8 px-3 normal-case tracking-normal" activeClassName="border-[#6ecbff]/55 bg-[#6ecbff]/16 text-[#9ee8ff]" inactiveClassName="border-white/10 bg-white/[0.025] text-slate-400 hover:border-[#6ecbff]/35 hover:text-white" />
            <FilterGroup
              label="Alphabet"
              options={alphabet}
              value={letter}
              onChange={setLetter}
              collapsed
              expanded={alphabetExpanded}
              onToggleExpand={() => setAlphabetExpanded((current) => !current)}
              buttonClassName="min-h-8 px-3 normal-case tracking-normal"
              activeClassName="border-[#6ecbff]/55 bg-[#6ecbff]/16 text-[#9ee8ff]"
              inactiveClassName="border-white/10 bg-white/[0.025] text-slate-400 hover:border-[#6ecbff]/35 hover:text-white"
            />
          </div>
        </section>

        {status === "loading" ? <p className="mt-10 text-sm text-slate-400">Loading constellations from database...</p> : null}

        {status === "error" ? (
          <p className="mt-10 rounded-2xl border border-red-300/20 bg-red-950/25 px-4 py-3 text-sm text-red-100">
            Could not load constellations from the backend.
          </p>
        ) : null}

        {monthlyConstellations.length || monthlyStatus === "loading" ? (
          <section className="mt-10 border-y border-white/10 py-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6ecbff]/72 sm:tracking-[0.34em]">Visible This Month</p>
                <h2 className="mt-2 font-display text-3xl font-light text-white">Monthly guide</h2>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Month {currentMonth}</p>
            </div>
            {monthlyStatus === "loading" ? (
              <p className="mt-5 text-sm text-slate-500">Loading monthly constellations...</p>
            ) : (
              <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
                {monthlyConstellations.map((item) => (
                  <Link
                    key={item.slug}
                    to={`/constellations/${item.slug}`}
                    className="min-w-48 border border-white/10 bg-white/[0.025] px-4 py-3 transition hover:border-[#6ecbff]/45 hover:bg-[#6ecbff]/10 sm:min-w-56"
                  >
                    <p className="truncate text-base font-semibold text-white">{item.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.bestSeason || "Seasonal"} / {item.brightestStar || item.abbreviation}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        ) : null}

        <div className="mt-10 border-y border-white/10 py-5">
          <p className="text-sm font-semibold text-slate-300">
            Showing {pageStart}-{pageEnd} of {filteredConstellations.length} constellations
          </p>
          <Pagination className="mt-6" page={currentPage} totalPages={pageCount} disabled={status === "loading"} onPageChange={setPage} />
        </div>

        <section className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {paginatedConstellations.map((constellation) => (
            <article
              key={constellation.slug || constellation.name}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-[#070914]/78 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-[#6ecbff]/36 hover:shadow-[0_26px_90px_rgba(110,203,255,0.13)]"
            >
              <Link to={`/constellations/${constellation.slug}`} className="block w-full text-left">
                <div className="relative h-44 overflow-hidden border-b border-white/8 bg-[radial-gradient(circle_at_50%_48%,rgba(111,48,183,0.22),transparent_45%),#050611] p-5">
                  <ConstellationSketch constellation={constellation} compact className="origin-center transition duration-700 ease-out group-hover:scale-105 group-hover:rotate-[2deg]" />
                  <span className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[#9bd5ff]">
                    {getCategory(constellation)}
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex items-baseline justify-between gap-4">
                    <h2 className="text-xl font-bold text-white">{constellation.name}</h2>
                    <p className="text-xs italic text-slate-500">{constellation.latinName || constellation.abbreviation}</p>
                  </div>
                  <p className="mt-4 line-clamp-3 min-h-[5.25rem] text-base leading-7 text-slate-300/72">{constellation.description}</p>
                  <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[#7fbce6]/70">
                    <span>{getHemisphere(constellation)}</span>
                    <span>-</span>
                    <span>{constellation.bestSeason || "Seasonal"}</span>
                  </div>
                </div>
              </Link>
              <div className="flex items-center justify-between border-t border-white/8 px-5 py-4">
                <Link to={`/constellations/${constellation.slug}`} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-white/78 transition hover:text-[#9bd5ff]">
                  <Eye className="h-4 w-4" />
                  View
                </Link>
                <p className="text-xs text-slate-500">{constellation.abbreviation}</p>
              </div>
              {isAdmin ? (
                <div className="border-t border-white/8 px-5 py-4">
                  <AdminResourceActions
                    resourceName="constellation"
                    endpoint="/astronomy/constellations"
                    slug={constellation.slug}
                    item={constellation}
                    onUpdated={loadConstellations}
                    onDeleted={loadConstellations}
                  />
                </div>
              ) : null}
            </article>
          ))}
        </section>

        <Pagination className="mt-12" page={currentPage} totalPages={pageCount} disabled={status === "loading"} onPageChange={setPage} />

        <section id="ai-recognition" className="mt-20 scroll-mt-28 rounded-3xl border border-white/10 bg-white/[0.035] shadow-[0_24px_100px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <div className="grid min-w-0 gap-px bg-white/10 lg:grid-cols-[1.02fr_0.98fr]">
            <form onSubmit={handleRecognize} className="bg-slate-950/60 p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.36em] text-[#6ecbff]/70">Recognition</p>
                  <h2 className="mt-3 font-display text-3xl font-light tracking-tight text-white sm:text-4xl">Sky Pattern Scan</h2>
                </div>
                {user ? (
                  <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100">Signed in</span>
                ) : (
                  <Link to="/login" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/10 px-4 text-sm text-cyan-100">
                    <LogIn size={16} />
                    Login
                  </Link>
                )}
              </div>

              <div className="mt-6 grid gap-4">
                <label htmlFor="constellation-image" className="group grid min-h-56 cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed border-white/18 bg-white/[0.025] transition-colors hover:border-cyan-200/45 hover:bg-cyan-200/[0.045]">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Selected night sky" className="h-56 w-full object-cover sm:h-72" />
                  ) : (
                    <span className="grid justify-items-center gap-3 px-6 text-center">
                      <ImageUp size={38} className="text-cyan-100/80" />
                      <span className="max-w-xs text-base font-light text-slate-400">{uploadLabel}</span>
                    </span>
                  )}
                </label>
                <input
                  id="constellation-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                  className="sr-only"
                  onChange={(event) => {
                    setSelectedImage(event.target.files?.[0] || null);
                    setRecognitionResult(null);
                    setRecognitionError("");
                    setRecognitionStatus("idle");
                  }}
                />

                {selectedImage ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3">
                    <span className="min-w-0 truncate text-sm text-slate-300">{selectedImage.name}</span>
                    <button type="button" onClick={clearSelection} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:text-white" aria-label="Clear selected image" title="Clear selected image">
                      <X size={16} />
                    </button>
                  </div>
                ) : null}

                <label className="grid gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.34em] text-slate-500">Hint</span>
                  <input value={hint} onChange={(event) => setHint(event.target.value)} placeholder="Orion, Scorpius, Ursa Major..." className="min-h-12 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-200/55" />
                </label>

                {recognitionError ? (
                  <p className="flex items-start gap-2 rounded-2xl border border-red-300/20 bg-red-950/25 px-4 py-3 text-sm text-red-100">
                    <AlertCircle size={18} className="mt-1 shrink-0" />
                    <span>{recognitionError}</span>
                  </p>
                ) : null}

                <button type="submit" disabled={!canSubmit} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-cyan-200/20 bg-cyan-200/12 px-5 text-sm font-semibold text-cyan-50 transition hover:bg-cyan-200/18 disabled:cursor-not-allowed disabled:opacity-50">
                  {isRecognizing ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
                  {isRecognizing ? "Scanning" : "Scan Image"}
                </button>
              </div>
            </form>

            <div className="bg-slate-950/45 p-6 md:p-8">
              <div className="flex items-center gap-3">
                <Sparkles size={22} className="text-cyan-100/75" />
                <h3 className="font-display text-2xl font-light tracking-tight text-white sm:text-3xl">Recognition Result</h3>
              </div>

              {recognition ? (
                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-slate-500">{recognition.status}</p>
                        <h4 className="mt-3 break-words font-display text-3xl font-light tracking-tight text-white sm:text-4xl">{recognizedConstellation?.name || "No confident match"}</h4>
                      </div>
                      {recognition.status === "RECOGNIZED" ? <CheckCircle2 size={26} className="shrink-0 text-emerald-200" /> : <AlertCircle size={26} className="shrink-0 text-amber-200" />}
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <Metric label="Confidence" value={formatConfidence(recognition.confidence)} />
                      <Metric label="Source" value={recognition.source || "AI"} />
                      <Metric label="Threshold" value={formatConfidence(recognition.threshold)} />
                    </div>
                    {recognition.analysis ? <p className="mt-5 text-base font-light leading-8 text-slate-300/72">{recognition.analysis}</p> : null}
                  </div>

                  {recognizedConstellation ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                      <p className="text-sm font-light text-slate-300">{recognizedConstellation.latinName || recognizedConstellation.abbreviation || "Known constellation"}</p>
                      <p className="mt-2 text-xs text-slate-500">Best season: {recognizedConstellation.bestSeason || "Seasonal"} / Best month: {recognizedConstellation.bestMonth || "Variable"}</p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-6">
                  <p className="text-base font-light leading-8 text-slate-300/68">A recognized constellation will appear here with confidence, source, and matched sky details.</p>
                </div>
              )}

              <div className="mt-8">
                <div className="flex items-center gap-3">
                  <History size={18} className="text-slate-500" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-slate-500">Recent scans</p>
                </div>
                <div className="mt-4 space-y-3">
                  {authLoading || uploadsStatus === "loading" ? (
                    <p className="text-sm text-slate-500">Loading recent scans...</p>
                  ) : uploads.length ? (
                    uploads.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-3">
                        <img src={item.originalUrl} alt={item.fileName} className="h-14 w-14 rounded-xl object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-white">{item.constellation?.name || item.recognizedConstellation || "Unrecognized"}</p>
                          <p className="text-xs text-slate-500">{formatConfidence(item.confidenceScore)}</p>
                        </div>
                        <button type="button" onClick={() => handleDeleteUpload(item.id)} disabled={deletingUploadId === item.id} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition hover:border-red-200/30 hover:bg-red-400/10 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-50" aria-label={`Delete ${item.fileName || "scan"}`} title="Delete scan">
                          {deletingUploadId === item.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </button>
                      </div>
                    ))
                  ) : user ? (
                    <p className="text-sm text-slate-500">No scans yet.</p>
                  ) : (
                    <p className="text-sm text-slate-500">Login keeps recent scans with your profile.</p>
                  )}
                  {uploadsError ? (
                    <p className="flex items-start gap-2 rounded-2xl border border-red-300/20 bg-red-950/25 px-4 py-3 text-sm text-red-100">
                      <AlertCircle size={18} className="mt-1 shrink-0" />
                      <span>{uploadsError}</span>
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
