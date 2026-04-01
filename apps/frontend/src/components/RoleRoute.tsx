import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

interface Props {
  role: "worker" | "manager";
  children: ReactNode;
}

export default function RoleRoute({ role, children }: Props) {
  const { auth } = useAuth();
  if (auth.status !== "authenticated") return null;
  if (auth.role !== role) {
    return <Navigate to={auth.role === "manager" ? "/manager" : "/"} replace />;
  }
  return <>{children}</>;
}
