import { Search } from "lucide-react";

export function SearchField({
  value,
  onChange,
  placeholder = "Search",
  className = "",
  inputClassName = "",
  iconClassName = "",
  ...props
}) {
  return (
    <label className={`relative block ${className}`}>
      <Search className={`pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/35 ${iconClassName}`} />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`min-h-12 w-full border border-white/10 bg-black/25 pl-12 pr-4 text-base text-foreground outline-none transition focus:border-cyan-200/45 ${inputClassName}`}
        {...props}
      />
    </label>
  );
}
