import { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { LogIn, LogOut, Menu, User, UserPlus, X } from "lucide-react";
import { useAuth } from "../../context/authState";

const links = [
  { to: "/", label: "Home", exact: true },
  { to: "/planets", label: "Planets", exact: false },
  { to: "/constellations", label: "Constellations", exact: false },
  { to: "/observatory", label: "Observatory", exact: false },
  { to: "/news", label: "News", exact: false },
  { to: "/dashboard", label: "Dashboard", exact: false },
  { to: "/assistant", label: "Assistant", exact: false },
];

export function SiteHeader() {
  const { user, logout, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const linkBase =
    "relative inline-flex min-h-9 items-center rounded-full px-3 text-[10.5px] font-sans font-light tracking-[0.28em] uppercase whitespace-nowrap text-foreground/48 transition-all duration-500 ease-out hover:bg-foreground/[0.06] hover:text-foreground";
  const inactiveClass = `${linkBase} after:content-[''] after:absolute after:left-3 after:right-3 after:-bottom-1 after:h-px after:origin-center after:scale-x-0 after:bg-[#6ecbff]/75 after:transition-transform after:duration-500 after:ease-out hover:after:scale-x-100`;
  const activeClass = `${linkBase} border border-[#6ecbff]/35 bg-[#6ecbff]/10 text-foreground shadow-[0_0_28px_rgba(110,203,255,0.12)]`;
  const authButton =
    "inline-flex h-9 w-9 items-center justify-center rounded-full border border-foreground/15 text-foreground/55 transition hover:border-foreground/35 hover:bg-foreground/10 hover:text-foreground";
  const mobileLink = (isActive) =>
    isActive
      ? "rounded-full border border-[#6ecbff]/25 bg-[#6ecbff]/10 px-5 py-3 text-xs font-sans font-light tracking-[0.35em] uppercase text-foreground shadow-[0_0_28px_rgba(110,203,255,0.12)]"
      : "rounded-full px-5 py-3 text-xs font-sans font-light tracking-[0.35em] uppercase text-foreground/55 transition-colors duration-500 hover:bg-foreground/[0.06] hover:text-foreground";

  return (
    <>
      <header
        className={[
          "fixed top-0 inset-x-0 z-50 pointer-events-none",
          "transition-[background-color,backdrop-filter,border-color,padding] duration-500 ease-out",
          scrolled ? "bg-background/55 backdrop-blur-xl border-b border-foreground/10" : "bg-[#020712]/18 border-b border-foreground/10",
        ].join(" ")}
      >
        <div
          className={[
            "mx-auto flex max-w-7xl items-center justify-between gap-8 px-6 sm:px-10 lg:px-14",
            "transition-[padding] duration-500 ease-out",
            scrolled ? "py-4" : "py-7",
          ].join(" ")}
        >
          <Link to="/" className="pointer-events-auto group inline-flex shrink-0 items-center gap-3">
            <span className="font-display text-sm font-bold uppercase tracking-[-0.03em] text-foreground/90 transition-colors duration-500 group-hover:text-foreground">
              SPACEVERSE
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-x-5 xl:gap-x-8 pointer-events-auto">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.exact} className={({ isActive }) => (isActive ? activeClass : inactiveClass)}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:flex pointer-events-auto items-center gap-2">
            {!loading && user ? (
              <>
                <Link to="/profile" className={authButton} aria-label="Profile" title="Profile">
                  <User className="h-4 w-4" />
                </Link>
                <button type="button" onClick={logout} className={authButton} aria-label="Logout" title="Logout">
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={authButton} aria-label="Login" title="Login">
                  <LogIn className="h-4 w-4" />
                </Link>
                <Link to="/register" className={authButton} aria-label="Register" title="Register">
                  <UserPlus className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="lg:hidden pointer-events-auto -mr-2 p-2 text-foreground/60 hover:text-foreground transition-colors duration-300"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div
        className={[
          "fixed inset-0 z-40 lg:hidden bg-background/95 backdrop-blur-2xl",
          "transition-opacity duration-500 ease-out",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
      >
        <nav className="flex h-full flex-col items-center justify-center gap-10 px-6">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.exact} onClick={() => setOpen(false)} className={({ isActive }) => mobileLink(isActive)}>
              {link.label}
            </NavLink>
          ))}
          {!loading && user ? (
            <>
              <NavLink to="/profile" onClick={() => setOpen(false)} className={({ isActive }) => mobileLink(isActive)}>
                Profile
              </NavLink>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
                className="rounded-full px-5 py-3 text-xs font-sans font-light tracking-[0.35em] uppercase text-foreground/55 transition-colors duration-500 hover:bg-foreground/[0.06] hover:text-foreground"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={() => setOpen(false)} className={({ isActive }) => mobileLink(isActive)}>
                Login
              </NavLink>
              <NavLink to="/register" onClick={() => setOpen(false)} className={({ isActive }) => mobileLink(isActive)}>
                Register
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </>
  );
}
