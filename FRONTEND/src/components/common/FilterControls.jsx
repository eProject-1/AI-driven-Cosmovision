import { ChevronDown } from "lucide-react";

export function FilterPill({
  active = false,
  children,
  className = "",
  activeClassName = "border-white bg-white text-black shadow-lg shadow-white/10",
  inactiveClassName = "border-white/10 bg-white/[0.03] text-foreground/75 hover:border-white/40 hover:bg-white/15 hover:text-white",
  ...props
}) {
  return (
    <button
      type="button"
      className={[
        "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition duration-300 ease-out",
        "hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
        active ? activeClassName : inactiveClassName,
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}

export function FilterGroup({
  label,
  options,
  value,
  onChange,
  getOptionLabel = (option) => option.label ?? option,
  getOptionValue = (option) => option.value ?? option,
  collapsed = false,
  expanded = false,
  onToggleExpand,
  labelClassName = "",
  rowClassName = "",
  buttonClassName = "",
  activeClassName,
  inactiveClassName,
}) {
  const visibleOptions = collapsed && !expanded ? options.slice(0, 6) : options;

  return (
    <div className={`grid gap-3 md:grid-cols-[8rem_1fr] md:items-center ${rowClassName}`}>
      {label ? <p className={`text-[11px] font-bold uppercase tracking-[0.34em] text-slate-500 ${labelClassName}`}>{label}</p> : null}
      <div className="flex flex-wrap gap-2">
        {visibleOptions.map((option) => {
          const optionValue = getOptionValue(option);
          return (
            <FilterPill
              key={optionValue}
              active={value === optionValue}
              onClick={() => onChange(optionValue)}
              className={buttonClassName}
              activeClassName={activeClassName}
              inactiveClassName={inactiveClassName}
            >
              {getOptionLabel(option)}
            </FilterPill>
          );
        })}
        {collapsed ? (
          <button
            type="button"
            onClick={onToggleExpand}
            className="inline-flex min-h-8 items-center gap-2 rounded-full border border-white/10 bg-white/[0.025] px-3 text-xs font-semibold text-slate-300 transition hover:border-[#6ecbff]/35 hover:text-white"
            aria-expanded={expanded}
          >
            {expanded ? "Collapse" : "..."}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
