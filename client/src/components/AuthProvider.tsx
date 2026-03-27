import { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { setToken, clearToken } from "../lib/queryClient";

interface AuthUser { id: number; email: string; name: string; plan: string; }
interface AuthCtx { user: AuthUser | null; login: (u: AuthUser, token: string) => void; logout: () => void; }

const Ctx = createContext<AuthCtx>({ user: null, login: () => {}, logout: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const hash = window.location.hash.replace("#", "") || "/";
    if (!user && hash !== "/auth") navigate("/auth");
  }, [ready, user]);

  const login = (u: AuthUser, token: string) => {
    setToken(token);
    setUser(u);
    navigate("/");
  };

  const logout = () => {
    clearToken();
    setUser(null);
    navigate("/auth");
  };

  if (!ready) return null;

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
