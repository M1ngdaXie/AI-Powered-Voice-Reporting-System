import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { avatarColor, initials } from "../utils/avatar";

interface User {
  userId: number;
  name: string;
  email: string;
  role: "worker" | "manager";
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/users", { credentials: "include" })
      .then((r) => r.json())
      .then(setUsers)
      .catch(() => setError("Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  async function toggleRole(user: User) {
    const newRole = user.role === "worker" ? "manager" : "worker";
    setUpdating(user.userId);
    setError("");
    const r = await fetch(`/api/admin/users/${user.userId}/role`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    setUpdating(null);
    if (!r.ok) {
      const data = await r.json();
      setError(data.error ?? "Failed to update role");
      return;
    }
    setUsers((prev) =>
      prev.map((u) =>
        u.userId === user.userId ? { ...u, role: newRole } : u
      )
    );
  }

  if (loading) {
    return (
      <div className="bg-[#f8fafc] dark:bg-[#0d0d0d] flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[#4f46e5] dark:border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0d0d0d]">
      <Navbar backTo={{ href: "/manager", label: "Dashboard" }} />

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-[#1e293b] dark:text-white text-2xl font-extrabold">
            Manage Users
          </h1>
          <p className="text-[#64748b] dark:text-[#6b7280] text-sm mt-1">
            Promote or demote team members
          </p>
        </div>

        {error && (
          <div className="bg-[#fef2f2] dark:bg-[#200a0a] border border-[#fecaca] dark:border-[#ef444430] rounded-xl px-4 py-3 mb-4">
            <p className="text-[#dc2626] dark:text-[#f87171] text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.userId}
              className={`bg-white dark:bg-[#161616] border rounded-2xl p-4 flex items-center gap-3 ${
                user.role === "manager"
                  ? "border-[#ddd6fe] dark:border-[#8b5cf630]"
                  : "border-[#e2e8f0] dark:border-[#2a2a2a]"
              }`}
            >
              <div
                className="w-10 h-10 rounded-full text-white font-bold text-sm flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: avatarColor(user.name) }}
              >
                {initials(user.name)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[#1e293b] dark:text-[#e2e8f0] text-sm font-semibold">
                  {user.name}
                </p>
                <p className="text-[#64748b] dark:text-[#6b7280] text-xs truncate">
                  {user.email}
                </p>
              </div>

              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                  user.role === "manager"
                    ? "bg-[#ede9fe] dark:bg-[#8b5cf620] border border-[#ddd6fe] dark:border-[#8b5cf640] text-[#7c3aed] dark:text-[#a78bfa]"
                    : "bg-[#f1f5f9] dark:bg-[#1f1f1f] border border-[#e2e8f0] dark:border-[#333] text-[#64748b] dark:text-[#9ca3af]"
                }`}
              >
                {user.role === "manager" ? "Manager" : "Worker"}
              </span>

              {user.role === "worker" ? (
                <button
                  onClick={() => toggleRole(user)}
                  disabled={updating === user.userId}
                  className="bg-[#4f46e5] dark:bg-gradient-to-br dark:from-[#8b5cf6] dark:to-[#3b82f6] text-white text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap disabled:opacity-40"
                >
                  {updating === user.userId ? "..." : "Promote"}
                </button>
              ) : (
                <button
                  onClick={() => toggleRole(user)}
                  disabled={updating === user.userId}
                  className="bg-[#fef2f2] dark:bg-[#200a0a] border border-[#fecaca] dark:border-[#ef444430] text-[#dc2626] dark:text-[#f87171] text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap disabled:opacity-40"
                >
                  {updating === user.userId ? "..." : "Demote"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
