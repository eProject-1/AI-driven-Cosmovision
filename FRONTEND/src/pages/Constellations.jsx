import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, History, ImageUp, Loader2, LogIn, Sparkles, Trash2, UploadCloud, X } from "lucide-react";
import { Link } from "react-router-dom";
import { PageShell } from "../components/lovable/PageShell";
import { DataGrid, SectionPanel } from "../components/lovable/Framing";
import { useAuth } from "../context/AuthContext";
import {
  deleteConstellationUpload,
  getConstellations,
  getMyConstellationUploads,
  recognizeConstellationImage,
} from "../services/astronomy.api";

function getErrorMessage(error) {
  return error?.response?.data?.message || error?.message || "Recognition failed.";
}

function formatConfidence(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0%";
  return `${Math.round(numeric * 100)}%`;
}

export default function LovableConstellations() {
  const { user, loading: authLoading } = useAuth();
  const [constellations, setConstellations] = useState([]);
  const [status, setStatus] = useState("loading");
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

  useEffect(() => {
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
  }, []);

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

  const recognizedConstellation = recognitionResult?.recognition?.constellation;
  const recognition = recognitionResult?.recognition;
  const isRecognizing = recognitionStatus === "loading";
  const canSubmit = Boolean(user && selectedImage && !isRecognizing);

  const uploadLabel = useMemo(() => {
    if (selectedImage) return selectedImage.name;
    return "Night-sky image";
  }, [selectedImage]);

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
    <PageShell
      eyebrow="Chapter II"
      title="Constellations"
      lead="Eighty-eight patterns drawn in starlight - humanity's oldest stories, still shining above us tonight."
    >
      <SectionPanel className="mb-8">
        <div className="grid gap-px bg-white/10 lg:grid-cols-[1.1fr_0.9fr]">
          <form onSubmit={handleRecognize} className="bg-slate-950/60 p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-light uppercase tracking-[0.35em] text-cyan-200/55">Recognition</p>
                <h2 className="mt-3 font-display text-3xl font-light tracking-tight text-white">Sky Pattern Scan</h2>
              </div>
              {user ? (
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100">
                  Signed in
                </span>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-cyan-200/20 bg-cyan-200/10 px-4 text-sm text-cyan-100"
                >
                  <LogIn size={16} />
                  Login
                </Link>
              )}
            </div>

            <div className="mt-6 grid gap-4">
              <label
                htmlFor="constellation-image"
                className="group grid min-h-52 cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed border-white/18 bg-white/[0.025] transition-colors hover:border-cyan-200/45 hover:bg-cyan-200/[0.045]"
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Selected night sky" className="h-64 w-full object-cover" />
                ) : (
                  <span className="grid justify-items-center gap-3 px-6 text-center">
                    <ImageUp size={34} className="text-cyan-100/80" />
                    <span className="max-w-xs text-sm font-light text-foreground/55">{uploadLabel}</span>
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
                  <span className="min-w-0 truncate text-sm text-foreground/65">{selectedImage.name}</span>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-foreground/65 transition-colors hover:text-white"
                    aria-label="Clear selected image"
                    title="Clear selected image"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : null}

              <label className="grid gap-2">
                <span className="text-[10px] font-light uppercase tracking-[0.35em] text-foreground/35">Hint</span>
                <input
                  value={hint}
                  onChange={(event) => setHint(event.target.value)}
                  placeholder="Orion, Scorpius, Ursa Major..."
                  className="min-h-12 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none transition-colors placeholder:text-foreground/30 focus:border-cyan-200/55"
                />
              </label>

              {recognitionError ? (
                <p className="flex items-start gap-2 rounded-2xl border border-red-300/20 bg-red-950/25 px-4 py-3 text-sm text-red-100">
                  <AlertCircle size={18} className="mt-1 shrink-0" />
                  <span>{recognitionError}</span>
                </p>
              ) : null}

              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-cyan-200/20 bg-cyan-200/12 px-5 text-sm font-medium text-cyan-50 transition-colors hover:bg-cyan-200/18 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRecognizing ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
                {isRecognizing ? "Scanning" : "Scan Image"}
              </button>
            </div>
          </form>

          <div className="bg-slate-950/45 p-6 md:p-8">
            <div className="flex items-center gap-3">
              <Sparkles size={20} className="text-cyan-100/75" />
              <h3 className="font-display text-2xl font-light tracking-tight text-white">Recognition Result</h3>
            </div>

            {recognition ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-light uppercase tracking-[0.35em] text-foreground/35">
                        {recognition.status}
                      </p>
                      <h4 className="mt-3 font-display text-3xl font-light tracking-tight text-white">
                        {recognizedConstellation?.name || "No confident match"}
                      </h4>
                    </div>
                    {recognition.status === "RECOGNIZED" ? (
                      <CheckCircle2 size={24} className="shrink-0 text-emerald-200" />
                    ) : (
                      <AlertCircle size={24} className="shrink-0 text-amber-200" />
                    )}
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <Metric label="Confidence" value={formatConfidence(recognition.confidence)} />
                    <Metric label="Source" value={recognition.source || "AI"} />
                    <Metric label="Threshold" value={formatConfidence(recognition.threshold)} />
                  </div>
                  {recognition.analysis ? (
                    <p className="mt-5 text-sm font-light leading-relaxed text-foreground/55">{recognition.analysis}</p>
                  ) : null}
                </div>

                {recognizedConstellation ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                    <p className="text-sm font-light text-foreground/60">
                      {recognizedConstellation.latinName || recognizedConstellation.abbreviation || "Known constellation"}
                    </p>
                    <p className="mt-2 text-xs text-foreground/40">
                      Best season: {recognizedConstellation.bestSeason || "Seasonal"} / Best month:{" "}
                      {recognizedConstellation.bestMonth || "Variable"}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-6">
                <p className="text-sm font-light leading-relaxed text-foreground/55">
                  A recognized constellation will appear here with confidence, source, and matched sky details.
                </p>
              </div>
            )}

            <div className="mt-8">
              <div className="flex items-center gap-3">
                <History size={18} className="text-foreground/45" />
                <p className="text-[10px] font-light uppercase tracking-[0.35em] text-foreground/35">Recent scans</p>
              </div>
              <div className="mt-4 space-y-3">
                {authLoading || uploadsStatus === "loading" ? (
                  <p className="text-sm text-foreground/45">Loading recent scans...</p>
                ) : uploads.length ? (
                  uploads.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-3">
                      <img src={item.originalUrl} alt={item.fileName} className="h-14 w-14 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-white">
                          {item.constellation?.name || item.recognizedConstellation || "Unrecognized"}
                        </p>
                        <p className="text-xs text-foreground/40">{formatConfidence(item.confidenceScore)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteUpload(item.id)}
                        disabled={deletingUploadId === item.id}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-foreground/55 transition-colors hover:border-red-200/30 hover:bg-red-400/10 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={`Delete ${item.fileName || "scan"}`}
                        title="Delete scan"
                      >
                        {deletingUploadId === item.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  ))
                ) : user ? (
                  <p className="text-sm text-foreground/45">No scans yet.</p>
                ) : (
                  <p className="text-sm text-foreground/45">Login keeps recent scans with your profile.</p>
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
      </SectionPanel>

      {status === "loading" && (
        <p className="text-sm font-light text-foreground/55">Loading constellations from database...</p>
      )}

      {status === "error" && (
        <p className="text-sm font-light text-red-200/80">Could not load constellations from the backend.</p>
      )}

      <DataGrid columns="sm:grid-cols-2 lg:grid-cols-3" className="mt-6">
        {constellations.map((c) => (
          <article key={c.slug || c.name} className="bg-background/70 p-8 backdrop-blur-sm">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-display text-2xl font-light tracking-tight">{c.name}</h2>
              <span className="text-[10px] font-light tracking-[0.3em] uppercase text-foreground/40">
                {c.bestSeason || c.quadrant || "Sky"}
              </span>
            </div>
            <p className="mt-6 text-sm font-light leading-relaxed text-foreground/55">
              {c.description ||
                `${c.name} belongs to the ${c.family || "night sky"} family and is best viewed around ${c.bestMonth || "its season"}.`}
            </p>
            <p className="mt-8 text-[10px] font-light tracking-[0.3em] uppercase text-foreground/35">
              {c.mainStars ? `${c.mainStars} main stars` : `${c.areaSqDeg ?? "Known"} sq deg`}
            </p>
          </article>
        ))}
      </DataGrid>
    </PageShell>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
      <p className="text-[10px] font-light uppercase tracking-[0.3em] text-foreground/35">{label}</p>
      <p className="mt-2 text-sm text-white">{value}</p>
    </div>
  );
}
