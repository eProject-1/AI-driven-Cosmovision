import { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { LogIn, LogOut, Menu, User, UserPlus, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const links = [
  { to: "/", label: "Home", exact: true },
  { to: "/planets", label: "Planets", exact: false },
  { to: "/constellations", label: "Constellations", exact: false },
  { to: "/observatory", label: "Observatory", exact: false },
  { to: "/news", label: "News", exact: false },
  { to: "/dashboard", label: "Dashboard", exact: false },
  { to: "/assistant", label: "Assistant", exact: false },
];

export function Navbar() {
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
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const linkBase = "relative inline-flex items-center text-[10.5px] font-sans font-light tracking-[0.28em] uppercase whitespace-nowrap text-foreground/45 hover:text-foreground transition-colors duration-500 ease-out";
  const indicator = "after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2 after:-bottom-2 after:h-px after:w-0 after:bg-foreground/70 after:transition-all after:duration-500 after:ease-out hover:after:w-4";
  const activeClass = "relative inline-flex items-center text-[10.5px] font-sans font-light tracking-[0.28em] uppercase whitespace-nowrap text-foreground transition-colors duration-500 ease-out after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2 after:-bottom-2 after:h-px after:w-4 after:bg-foreground/80";
  const authButton = "inline-flex h-9 w-9 items-center justify-center rounded-full border border-foreground/15 text-foreground/55 transition hover:border-foreground/35 hover:bg-foreground/10 hover:text-foreground";

  return (
    <>
      <header className={["fixed top-0 inset-x-0 z-50 pointer-events-none","transition-[background-color,backdrop-filter,border-color,padding] duration-500 ease-out", scrolled ? "bg-background/55 backdrop-blur-xl border-b border-foreground/10" : "bg-transparent border-b border-transparent"].join(" ")}>
        <div className={["mx-auto flex max-w-7xl items-center justify-between gap-8 px-6 sm:px-10 lg:px-14","transition-[padding] duration-500 ease-out", scrolled ? "py-4" : "py-7"].join(" ")}>
          <Link to="/" className="pointer-events-auto group shrink-0">
            <span className="font-display text-[11px] font-medium tracking-[0.42em] uppercase text-foreground/85 group-hover:text-foreground transition-colors duration-500">SPACEVERSE</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-x-9 xl:gap-x-12 pointer-events-auto">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? activeClass : `${linkBase} ${indicator}`)}>
                {l.label}
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

          <button onClick={() => setOpen((v) => !v)} className="lg:hidden pointer-events-auto -mr-2 p-2 text-foreground/60 hover:text-foreground transition-colors duration-300" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div className={["fixed inset-0 z-40 lg:hidden bg-background/95 backdrop-blur-2xl","transition-opacity duration-500 ease-out", open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"].join(" ")}>
        <nav className="flex h-full flex-col items-center justify-center gap-10 px-6">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? "text-xs font-sans font-light tracking-[0.35em] uppercase text-foreground" : "text-xs font-sans font-light tracking-[0.35em] uppercase text-foreground/55 hover:text-foreground transition-colors duration-500"}>
              {l.label}
            </NavLink>
          ))}
          {!loading && user ? (
            <>
              <NavLink to="/profile" onClick={() => setOpen(false)} className={({ isActive }) => isActive ? "text-xs font-sans font-light tracking-[0.35em] uppercase text-foreground" : "text-xs font-sans font-light tracking-[0.35em] uppercase text-foreground/55 hover:text-foreground transition-colors duration-500"}>
                Profile
              </NavLink>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
                className="text-xs font-sans font-light tracking-[0.35em] uppercase text-foreground/55 hover:text-foreground transition-colors duration-500"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={() => setOpen(false)} className={({ isActive }) => isActive ? "text-xs font-sans font-light tracking-[0.35em] uppercase text-foreground" : "text-xs font-sans font-light tracking-[0.35em] uppercase text-foreground/55 hover:text-foreground transition-colors duration-500"}>
                Login
              </NavLink>
              <NavLink to="/register" onClick={() => setOpen(false)} className={({ isActive }) => isActive ? "text-xs font-sans font-light tracking-[0.35em] uppercase text-foreground" : "text-xs font-sans font-light tracking-[0.35em] uppercase text-foreground/55 hover:text-foreground transition-colors duration-500"}>
                Register
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </>
  );
}
