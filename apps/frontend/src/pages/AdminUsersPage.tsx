import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface User {
  userId: number;  // was: id
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
    setUsers((prev) => prev.map((u) => u.userId === user.userId ? { ...u, role: newRole } : u));
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/manager" className="text-gray-500 hover:text-gray-300 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-lg font-semibold">Manage Users</h1>
            <p className="text-xs text-gray-500">{users.length} account{users.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-950 border border-red-800 rounded-xl px-4 py-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.userId}
              className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-2xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-900/50 flex items-center justify-center text-sm font-medium text-indigo-300">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  user.role === "manager"
                    ? "bg-indigo-900/50 text-indigo-300 border border-indigo-800/50"
                    : "bg-gray-800 text-gray-400 border border-gray-700"
                }`}>
                  {user.role}
                </span>
                <button
                  onClick={() => toggleRole(user)}
                  disabled={updating === user.userId}
                  className="text-xs text-gray-500 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40"
                >
                  {updating === user.userId ? "..." : user.role === "worker" ? "Promote" : "Demote"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
