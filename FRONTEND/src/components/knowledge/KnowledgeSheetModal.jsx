import { useEffect, useId, useMemo, useRef, useState } from "react";
import { SaveKnowledgeButton } from "./SaveKnowledgeButton";
import { KnowledgeGallery } from "./KnowledgeGallery";
import { KnowledgeTimeline } from "./KnowledgeTimeline";
import { KnowledgeFacts } from "./KnowledgeFacts";

function useLockBodyScroll(locked) {
  useEffect(() => {
    if (!locked) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Prevent layout shift due to scrollbar disappearance
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [locked]);
}

function hasNonEmpty(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return Boolean(value);
}

export function KnowledgeSheetModal({
  isOpen,
  onClose,
  knowledge,
  launchButtonRef,
}) {
  const panelRef = useRef(null);
  const lastFocusRef = useRef(null);
  const titleId = useId();

  const [isVisible, setIsVisible] = useState(Boolean(isOpen));
  const [isClosing, setIsClosing] = useState(false);

  const animationDurationMs = 260;

  useLockBodyScroll(isOpen || isVisible);

  const note = knowledge || {};

  const coverImage = note.imageUrl || note.imageSrc || null;

  const galleryImages = note.galleryImages;
  const timeline = note.timeline;
  const keyFacts = note.keyFacts;

  const [heroImage, setHeroImage] = useState(coverImage);

  const detailIntro = note.detailIntro;
  const interestingFact = note.interestingFact;


  const shouldRenderGallery = hasNonEmpty(galleryImages);
  const shouldRenderTimeline = hasNonEmpty(timeline);
  const shouldRenderKeyFacts = hasNonEmpty(keyFacts);
  const shouldRenderDetailIntro = hasNonEmpty(detailIntro);
  const shouldRenderInteresting = hasNonEmpty(interestingFact);

  const close = () => {
    if (!isVisible || isClosing) return;

    setIsClosing(true);

    window.setTimeout(() => {
      setIsClosing(false);
      setIsVisible(false);
      onClose?.();
    }, animationDurationMs);
  };

  useEffect(() => {
    if (!isOpen) return;

    setIsVisible(true);
    setIsClosing(false);

    lastFocusRef.current = document.activeElement;

    const t = window.setTimeout(() => {
      panelRef.current?.focus?.();
    }, 0);

    return () => window.clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) return;

    const t = window.setTimeout(() => {
      const el = launchButtonRef?.current || lastFocusRef.current;
      if (el && typeof el.focus === "function") {
        el.focus();
      }
    }, animationDurationMs);

    return () => window.clearTimeout(t);
  }, [isOpen, launchButtonRef]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const modalTitle = note.title || "Knowledge Sheet";
  const subtitle = note.subtitle;

  const category = note.category;
  const slug = note.slug;

  const interestingFactText = typeof interestingFact === "string" ? interestingFact : null;

  const ctaLabel = note.ctaLabel;
  void ctaLabel;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[60]" aria-hidden={false}>
      <div
        className="absolute inset-0 bg-[#050816]/70 backdrop-blur-md"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      />

      <div
        className="absolute inset-0 flex items-center justify-center p-4 md:p-6"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
className="relative w-full max-w-4xl overflow-hidden rounded-[14px] border border-white/10 bg-[#070b1c]/70 shadow-[0_30px_120px_-60px_rgba(80,140,255,0.55)]"
          style={{
            animation: isClosing
              ? `modalOut ${animationDurationMs}ms ease-in both`
              : `modalIn ${animationDurationMs}ms ease-out both`,
          }}
        >
          <style>{`
            @keyframes modalIn {
              from { opacity: 0; transform: translateY(10px) scale(0.985); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes modalOut {
              from { opacity: 1; transform: translateY(0) scale(1); }
              to { opacity: 0; transform: translateY(10px) scale(0.985); }
            }
          `}</style>

          {/* Top background / cinematic */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(900px circle at 10% 0%, rgba(120,180,255,0.25), transparent 55%), radial-gradient(700px circle at 90% 20%, rgba(180,120,255,0.16), transparent 50%), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
            }}
          />

          <div className="relative max-h-[86vh] overflow-y-auto">
            {/* Header */}
              <div className="p-5 md:p-6 border-b border-white/10">

              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  {category ? (
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 backdrop-blur-md">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(120,180,255,0.9)]" />
                      <span className="font-display text-[11px] tracking-[0.32em] uppercase text-foreground/60">
                        {category}
                      </span>
                    </div>
                  ) : null}

                  <h3
                    id={titleId}
                    className="mt-5 font-display text-4xl md:text-5xl font-light tracking-[-0.02em] leading-tight text-foreground"
                  >
                    {modalTitle}
                  </h3>

                  {subtitle ? (
                    <p className="mt-4 text-base md:text-lg font-light leading-relaxed text-foreground/60">
                      {subtitle}
                    </p>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={close}
                  aria-label="Close knowledge sheet"
                  className="shrink-0 inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.03] h-10 w-10 text-foreground/70 hover:bg-white hover:text-black hover:border-white/35 transition-colors"
                >
                  <span aria-hidden className="text-xl leading-none">
                    ×
                  </span>
                </button>
              </div>

              {/* Hero image (single, updates via gallery thumbnails) */}
              {heroImage ? (
                <div className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
                  <img
                    src={heroImage}
                    alt={modalTitle}
                    className="h-[220px] w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ) : null}


              {/* Overview */}
              {shouldRenderDetailIntro ? (
                <div className="mt-4 max-w-2xl">
                  <p className="font-display text-xs tracking-[0.35em] uppercase text-foreground/45 mb-2">
                    Overview
                  </p>
                  <p className="text-sm md:text-base font-light leading-relaxed text-foreground/65">
                    {detailIntro}
                  </p>
                </div>
              ) : null}


              {/* Save */}
              <div className="mt-7 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                <div className="text-xs font-light tracking-[0.22em] uppercase text-foreground/35">
                  Save discovery
                </div>
                <SaveKnowledgeButton slug={slug} title={modalTitle} />
              </div>

            </div>

            {/* Body */}
            <div className="p-4 md:p-6 space-y-7">
              {shouldRenderGallery ? (
                <KnowledgeGallery
                  galleryImages={galleryImages}
                  title={modalTitle}
                  selectedImage={heroImage}
                  onSelectImage={(src) => setHeroImage(src)}
                />
              ) : null}


              {shouldRenderTimeline ? <KnowledgeTimeline timeline={timeline} /> : null}

              {shouldRenderKeyFacts ? <KnowledgeFacts keyFacts={keyFacts} /> : null}

              {shouldRenderInteresting ? (
                <section aria-label="Interesting fact">
                  <div className="mb-5 flex items-center justify-between">
                    <h4 className="font-display text-xs tracking-[0.35em] uppercase text-foreground/45">
                      Interesting fact
                    </h4>
                  </div>
<div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 md:p-7 relative overflow-hidden">
                    <div
                      aria-hidden
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          "radial-gradient(500px circle at 20% 0%, rgba(120,180,255,0.22), transparent 55%), radial-gradient(400px circle at 90% 20%, rgba(180,120,255,0.16), transparent 50%)",
                      }}
                    />
                    <p className="relative text-sm md:text-base font-light leading-relaxed text-foreground/70">
                      {interestingFactText || String(interestingFact)}
                    </p>
                  </div>
                </section>
              ) : null}
            </div>

            {/* Footer: subtle close */}
            <div className="p-5 md:p-8 border-t border-white/10 flex items-center justify-end">
              <button
                type="button"
                onClick={close}
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.03] px-5 py-2 text-sm font-semibold uppercase tracking-[0.14em] text-foreground/75 transition duration-300 hover:scale-[1.02] hover:border-white/40 hover:bg-white hover:text-black"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

