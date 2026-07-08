import { useMemo } from "react";

export function KnowledgeGallery({
  galleryImages = [],
  title = "",
  selectedImage,
  onSelectImage,
}) {
  const images = useMemo(
    () => (Array.isArray(galleryImages) ? galleryImages.filter(Boolean) : []),
    [galleryImages]
  );

  const thumbnails = useMemo(() => {
    return images.map((src, idx) => ({ src, idx }));
  }, [images]);

  const activeIndex = selectedImage ? Math.max(images.findIndex((src) => src === selectedImage), 0) : 0;

  if (!images.length) return null;

  return (
    <section aria-label="Gallery">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="font-display text-xs tracking-[0.35em] uppercase text-foreground/45">Gallery</h4>
      </div>

      {/* Desktop thumbnail grid only */}
      <div className="hidden md:block">
        <div className="grid grid-cols-4 gap-3">
          {thumbnails.map(({ src, idx }) => {
            const isActive = idx === activeIndex;
            return (
              <button
                type="button"
                key={`${src}-${idx}`}
                onClick={() => {
                  onSelectImage?.(src, idx);
                }}
                aria-label={title ? `Select gallery image ${idx + 1} of ${title}` : `Select gallery image ${idx + 1}`}
                className={`relative overflow-hidden rounded-2xl border bg-white/[0.02] transition-all duration-300 ${
                  isActive
                    ? "border-sky-300/70 shadow-[0_0_0_1px_rgba(56,189,248,0.25),0_0_22px_rgba(56,189,248,0.22)] ring-1 ring-sky-300/30"
                    : "border-white/10 hover:border-white/20 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_0_18px_rgba(255,255,255,0.08)]"
                }`}
              >
                <img src={src} alt="" loading="lazy" className="h-20 w-full object-cover" />
                {isActive ? (
                  <span
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                      background: "linear-gradient(180deg, rgba(120,180,255,0.15) 0%, transparent 65%)",
                    }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile thumbnail strip only */}
      <div className="md:hidden">
        <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none]">
          <style>{"div::-webkit-scrollbar{display:none}"}</style>
          <div className="flex gap-3">
            {thumbnails.map(({ src, idx }) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  type="button"
                  key={`${src}-${idx}-thumb-mobile`}
                  onClick={() => {
                    onSelectImage?.(src, idx);
                  }}
                  aria-label={title ? `Select gallery image ${idx + 1} of ${title}` : `Select gallery image ${idx + 1}`}
                  className={`relative h-20 w-28 overflow-hidden rounded-2xl border transition-colors flex-shrink-0 ${
                    isActive ? "border-sky-300/60" : "border-white/10 hover:border-white/20"
                  } bg-white/[0.02]`}
                >
                  <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}



