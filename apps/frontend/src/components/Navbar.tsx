import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { avatarColor, initials } from "../utils/avatar";

interface NavbarProps {
  /** If set, shows a back link instead of the logo on the left */
  backTo?: { href: string; label: string };
  /** Extra nav links shown in the right cluster */
  links?: { href: string; label: string }[];
  /** Show sign-out button */
  showSignOut?: boolean;
  /** Show "My Reports" clipboard icon link */
  showMyReports?: boolean;
}

export default function Navbar({ backTo, links = [], showSignOut, showMyReports }: NavbarProps) {
  const { auth, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const name = auth.status === "authenticated" ? auth.name : "";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="border-b border-[#e2e8f0] dark:border-[#1f1f1f] mb-6">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left: logo or back link */}
        <div className="flex items-center gap-3 min-w-0">
          {backTo ? (
            <Link
              to={backTo.href}
              className="text-[#64748b] dark:text-[#9ca3af] text-sm hover:text-[#1e293b] dark:hover:text-white transition-colors flex items-center gap-1 whitespace-nowrap"
            >
              ← {backTo.label}
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#4f46e5] dark:bg-gradient-to-br dark:from-[#8b5cf6] dark:to-[#3b82f6] flex items-center justify-center text-sm flex-shrink-0">
                🎙️
              </div>
              <span className="font-extrabold text-sm text-[#1e293b] dark:bg-gradient-to-r dark:from-[#a78bfa] dark:to-[#60a5fa] dark:bg-clip-text dark:text-transparent whitespace-nowrap">
                VoiceReport
              </span>
            </div>
          )}
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          {/* Nav links */}
          {links.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className="text-[#64748b] dark:text-[#9ca3af] text-sm hover:text-[#1e293b] dark:hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-[#f1f5f9] dark:hover:bg-[#1f1f1f] whitespace-nowrap"
            >
              {l.label}
            </Link>
          ))}

          {showMyReports && (
            <Link
              to="/my-reports"
              title="My Reports"
              className="w-7 h-7 rounded-lg bg-[#f1f5f9] dark:bg-[#1f1f1f] border border-[#e2e8f0] dark:border-[#333] flex items-center justify-center text-sm hover:opacity-80 transition-opacity flex-shrink-0"
            >
              📋
            </Link>
          )}

          {/* Help link */}
          <Link
            to="/help"
            title="Help & FAQ"
            className="w-7 h-7 rounded-lg bg-[#f1f5f9] dark:bg-[#1f1f1f] border border-[#e2e8f0] dark:border-[#333] flex items-center justify-center text-[#64748b] dark:text-[#9ca3af] hover:text-[#4f46e5] dark:hover:text-[#a78bfa] hover:border-[#4f46e5] dark:hover:border-[#8b5cf6] text-sm font-bold transition-colors shrink-0"
          >
            ?
          </Link>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-7 h-7 rounded-lg bg-[#f1f5f9] dark:bg-[#1f1f1f] border border-[#e2e8f0] dark:border-[#333] flex items-center justify-center text-sm hover:opacity-80 transition-opacity flex-shrink-0"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          {/* Avatar with dropdown — shown when authenticated */}
          {name && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 hover:opacity-80 transition-opacity"
                style={{ background: avatarColor(name) }}
                title={name}
              >
                {initials(name)}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-9 z-50 bg-white dark:bg-[#1f1f1f] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-xl shadow-lg py-1 min-w-[140px]">
                  <div className="px-3 py-2 border-b border-[#f1f5f9] dark:border-[#2a2a2a]">
                    <p className="text-[#1e293b] dark:text-white text-xs font-semibold truncate">{name}</p>
                  </div>
                  {showSignOut && (
                    <button
                      onClick={async () => { setMenuOpen(false); await logout(); navigate("/login"); }}
                      className="w-full text-left px-3 py-2 text-xs text-[#dc2626] dark:text-[#f87171] hover:bg-[#fef2f2] dark:hover:bg-[#200a0a] transition-colors"
                    >
                      Sign out
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
