import { ChevronLeft, ChevronRight } from "lucide-react";

function getVisiblePages(currentPage, totalPages, maxVisiblePages) {
  const safeTotal = Math.max(1, Number(totalPages) || 1);
  const safeCurrent = Math.min(Math.max(1, Number(currentPage) || 1), safeTotal);
  const visibleCount = Math.min(maxVisiblePages, safeTotal);
  const start = Math.max(1, Math.min(safeCurrent - Math.floor(visibleCount / 2), safeTotal - visibleCount + 1));

  return Array.from({ length: visibleCount }, (_, index) => start + index);
}

export function Pagination({
  page = 1,
  totalPages = 1,
  onPageChange,
  disabled = false,
  maxVisiblePages = 5,
  className = "",
}) {
  const safeTotal = Math.max(1, Number(totalPages) || 1);
  const safePage = Math.min(Math.max(1, Number(page) || 1), safeTotal);
  const pages = getVisiblePages(safePage, safeTotal, maxVisiblePages);
  const canGoPrev = safePage > 1 && !disabled;
  const canGoNext = safePage < safeTotal && !disabled;

  const goToPage = (nextPage) => {
    if (disabled || nextPage < 1 || nextPage > safeTotal || nextPage === safePage) return;
    onPageChange?.(nextPage);
  };

  const navButtonClass =
    "inline-flex h-14 min-w-[8.5rem] items-center justify-center gap-3 border border-white/10 bg-black/20 px-6 font-display text-sm uppercase tracking-[0.28em] text-white transition duration-300 hover:border-white/30 hover:bg-white/10 disabled:cursor-not-allowed disabled:text-white/25 disabled:hover:border-white/10 disabled:hover:bg-black/20";

  return (
    <div className={`w-full ${className}`}>
      <nav
        className="grid w-full grid-cols-1 items-center justify-items-center gap-4 md:grid-cols-[1fr_auto_1fr]"
        aria-label="Pagination"
      >
        <button
          type="button"
          onClick={() => goToPage(safePage - 1)}
          disabled={!canGoPrev}
          className={`${navButtonClass} justify-self-center md:justify-self-start`}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </button>

        <div className="flex items-center justify-center gap-2">
          {pages.map((pageNumber) => {
            const active = pageNumber === safePage;
            return (
              <button
                key={pageNumber}
                type="button"
                onClick={() => goToPage(pageNumber)}
                disabled={disabled}
                aria-current={active ? "page" : undefined}
                className={[
                  "grid h-[52px] min-w-[52px] place-items-center border px-4 font-display text-lg transition duration-300 disabled:cursor-not-allowed",
                  active
                    ? "border-white bg-white text-black"
                    : "border-white/10 bg-black/20 text-white hover:border-white/30 hover:bg-white/10",
                ].join(" ")}
              >
                {pageNumber}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => goToPage(safePage + 1)}
          disabled={!canGoNext}
          className={`${navButtonClass} justify-self-center md:justify-self-end`}
          aria-label="Next page"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
      <p className="mt-4 text-center text-[11px] font-light uppercase tracking-[0.28em] text-foreground/40">
        Page {safePage}/{safeTotal}
      </p>
    </div>
  );
}
