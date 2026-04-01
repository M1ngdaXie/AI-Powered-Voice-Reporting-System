import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AuthState, AuthUser } from "../types";

interface AuthContextValue {
  auth: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error("unauthenticated");
        return r.json();
      })
      .then((user: AuthUser) => setAuth({ status: "authenticated", ...user }))
      .catch(() => setAuth({ status: "unauthenticated" }));
  }, []);

  async function login(email: string, password: string) {
    const r = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!r.ok) {
      const data = await r.json();
      throw new Error(data.error ?? "Login failed");
    }
    const user: AuthUser = await r.json();
    setAuth({ status: "authenticated", ...user });
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setAuth({ status: "unauthenticated" });
  }

  async function register(name: string, email: string, password: string) {
    const r = await fetch("/api/auth/register", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (!r.ok) {
      const data = await r.json();
      throw new Error(data.error ?? "Registration failed");
    }
    const user: AuthUser = await r.json();
    setAuth({ status: "authenticated", ...user });
  }

  return (
    <AuthContext.Provider value={{ auth, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
