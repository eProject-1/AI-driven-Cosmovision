import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

export function AuthPanel({
  brand = "CosmoVision",
  brandTo = "/",
  icon,
  eyebrow,
  title,
  description,
  error,
  notice,
  children,
  footer,
}) {
  return (
    <main className="min-h-screen px-6 pt-32 pb-16 text-white">
      <section className="mx-auto grid w-full max-w-md gap-8">
        <Link to={brandTo} className="inline-flex items-center gap-3 text-sm font-semibold text-slate-300">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-200 text-sm font-black text-slate-950">
            {icon || "CV"}
          </span>
          <span className="text-base font-bold text-white">{brand}</span>
        </Link>

        <div className="grid gap-5 border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/30 backdrop-blur">
          <div>
            {eyebrow && <p className="text-xs font-bold uppercase tracking-normal text-cyan-200/80">{eyebrow}</p>}
            <h1 className="mt-2 text-3xl font-bold">{title}</h1>
            {description && <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>}
          </div>

          {notice && <div className="border border-cyan-200/20 bg-cyan-950/30 px-4 py-3 text-sm text-cyan-100">{notice}</div>}
          {error && <div className="border border-red-300/30 bg-red-950/40 px-4 py-3 text-sm text-red-100">{error}</div>}

          {children}

          {footer && <div className="border-t border-white/10 pt-4 text-center text-sm text-slate-400">{footer}</div>}
        </div>
      </section>
    </main>
  );
}

export function AuthField({ label, type = "text", value, onChange, placeholder, required = true, ...props }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-300">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="h-11 border border-white/10 bg-white/5 px-3 text-white transition placeholder:text-slate-500 focus:border-cyan-200/70 focus:bg-white/10"
        {...props}
      />
    </label>
  );
}

export function PasswordField({ label = "Password", value, onChange, visible, onToggle, placeholder, ...props }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-300">
      {label}
      <div className="flex h-11 border border-white/10 bg-white/5 transition focus-within:border-cyan-200/70 focus-within:bg-white/10">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required
          className="min-w-0 flex-1 bg-transparent px-3 text-white outline-none placeholder:text-slate-500"
          {...props}
        />
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex w-11 items-center justify-center text-slate-400 transition hover:text-white"
          aria-label={visible ? "Hide password" : "Show password"}
          title={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );
}

export function AuthSubmitButton({ icon, loading, loadingText, children, disabled }) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className="inline-flex h-11 items-center justify-center gap-2 bg-cyan-200 px-4 text-sm font-bold text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {icon}
      {loading ? loadingText : children}
    </button>
  );
}
