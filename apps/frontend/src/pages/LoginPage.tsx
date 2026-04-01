import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function LoginPage() {
  const { login, auth } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (auth.status === "authenticated") {
      navigate(auth.role === "manager" ? "/manager" : "/", { replace: true });
    }
  }, [auth.status]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0d0d0d] flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-lg bg-white dark:bg-[#1f1f1f] border border-[#e2e8f0] dark:border-[#333] flex items-center justify-center text-sm"
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </div>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#4f46e5] dark:bg-gradient-to-br dark:from-[#8b5cf6] dark:to-[#3b82f6] flex items-center justify-center text-2xl">
            🎙️
          </div>
          <h1 className="text-xl font-extrabold text-[#1e293b] dark:bg-gradient-to-r dark:from-[#a78bfa] dark:to-[#60a5fa] dark:bg-clip-text dark:text-transparent">
            VoiceReport
          </h1>
          <p className="text-[#94a3b8] text-xs">AI-powered work updates</p>
        </div>
        <div className="bg-white dark:bg-[#161616] border border-[#e2e8f0] dark:border-[#8b5cf6]/20 rounded-2xl p-6 shadow-[0_4px_16px_rgba(79,70,229,0.08)] dark:shadow-none">
          <div className="h-[2px] bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] rounded-full -mx-6 -mt-6 mb-6" />
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#64748b] dark:text-[#9ca3af] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="you@company.com"
                className="w-full bg-[#f8fafc] dark:bg-[#1f1f1f] text-[#1e293b] dark:text-white rounded-lg px-3 py-2 border border-[#e2e8f0] dark:border-[#333] focus:outline-none focus:border-[#4f46e5] dark:focus:border-[#8b5cf6] transition-colors text-sm placeholder:text-[#94a3b8] dark:placeholder:text-[#6b7280]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#64748b] dark:text-[#9ca3af] mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-[#f8fafc] dark:bg-[#1f1f1f] text-[#1e293b] dark:text-white rounded-lg px-3 py-2 border border-[#e2e8f0] dark:border-[#333] focus:outline-none focus:border-[#4f46e5] dark:focus:border-[#8b5cf6] transition-colors text-sm placeholder:text-[#94a3b8] dark:placeholder:text-[#6b7280]"
              />
            </div>
            {error && (
              <div className="bg-[#fef2f2] dark:bg-[#160808] border border-[#fecaca] dark:border-[#ef4444]/30 rounded-lg px-4 py-3">
                <p className="text-[#dc2626] dark:text-[#f87171] text-sm">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4f46e5] dark:bg-gradient-to-r dark:from-[#8b5cf6] dark:to-[#3b82f6] hover:opacity-90 text-white font-bold py-2.5 rounded-lg disabled:opacity-50 transition-opacity text-sm mt-2"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
          <p className="text-center text-[#94a3b8] dark:text-[#6b7280] text-xs mt-4">
            No account?{" "}
            <Link to="/register" className="text-[#4f46e5] dark:text-[#a78bfa] font-semibold hover:opacity-80 transition-opacity">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
