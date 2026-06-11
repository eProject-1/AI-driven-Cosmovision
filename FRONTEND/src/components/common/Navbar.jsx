import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Telescope, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

const NAV_LINKS = [
  { to: "/", label: "Trang Chủ" },
  { to: "/planets", label: "Hành Tinh" },
  { to: "/constellations", label: "Chòm Sao" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur-md border-b border-purple-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <Telescope className="w-7 h-7 text-purple-400 group-hover:text-purple-300 transition-colors" />
          <span className="font-bold text-lg text-white">
            Cosmo<span className="text-purple-400">Vision</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm transition-colors ${
                location.pathname === link.to
                  ? "text-purple-400 font-semibold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-gray-400">Xin chào, <span className="text-white font-medium">{user.name}</span></span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </>
          ) : (
            <Link to="/login" className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors">
              Đăng nhập
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-gray-400" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-gray-950 border-t border-purple-900/30 px-4 py-4 flex flex-col gap-3">
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="text-gray-300 hover:text-white" onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          {user && (
            <button onClick={handleLogout} className="text-left text-red-400 text-sm">
              Đăng xuất
            </button>
          )}
        </div>
      )}
    </nav>
  );
}