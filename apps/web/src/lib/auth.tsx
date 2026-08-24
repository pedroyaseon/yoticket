"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";

export type SessionUser = {
  id: string;
  email: string;
  role: "ORGANIZER" | "CUSTOMER" | "GATE";
};

type AuthContextValue = {
  user: SessionUser | null;
  loading: boolean;
  signIn: (accessToken: string, user: SessionUser) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      await Promise.resolve();
      if (!localStorage.getItem("yoticket.token")) {
        setLoading(false);
        return;
      }

      try {
        setUser(await api<SessionUser>("/auth/me"));
      } catch {
        localStorage.removeItem("yoticket.token");
        localStorage.removeItem("yoticket.role");
      } finally {
        setLoading(false);
      }
    }

    void restoreSession();
  }, []);

  const signIn = useCallback((accessToken: string, nextUser: SessionUser) => {
    localStorage.setItem("yoticket.token", accessToken);
    localStorage.setItem("yoticket.role", nextUser.role);
    setUser(nextUser);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem("yoticket.token");
    localStorage.removeItem("yoticket.role");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, signOut }),
    [loading, signIn, signOut, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  return context;
}
