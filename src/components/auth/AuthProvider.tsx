"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type AuthUser = {
  id: number;
  phone: string;
  role: "user" | "admin";
  name?: string | null;
  avatarUrl?: string | null;
  profileComplete?: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function withComplete(user: AuthUser | null): AuthUser | null {
  if (!user) return null;
  return {
    ...user,
    profileComplete: Boolean(user.name?.trim() && user.avatarUrl?.trim()),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = (await res.json()) as { ok: boolean; user: AuthUser | null };
      setUser(data.ok ? withComplete(data.user) : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function displayName(user: AuthUser) {
  if (user.name?.trim()) return user.name.trim();
  if (user.phone.length >= 4) return `کاربر ${user.phone.slice(-4)}`;
  return "کاربر";
}
