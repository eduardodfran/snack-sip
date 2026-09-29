"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  /** undefined = still loading, null = logged out, Profile = signed in. */
  profile: Profile | null | undefined;
  /** Re-reads the profiles row (points/name/role) after a mutation. */
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: undefined,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const userRef = useRef<User | null>(null);
  const loadSeq = useRef(0);

  const loadProfile = useCallback(async (u: User | null) => {
    const seq = ++loadSeq.current;
    userRef.current = u;

    if (!u) {
      setProfile(null);
      return;
    }

    try {
      const supabase = getSupabase();
      const { data } = await supabase
        .from("profiles")
        .select("id, name, role, points")
        .eq("id", u.id)
        .maybeSingle();
      if (seq !== loadSeq.current) return;
      setProfile(
        data
          ? {
              id: data.id,
              name: data.name,
              email: u.email ?? "",
              role: data.role,
              points: data.points,
            }
          : null,
      );
    } catch {
      if (seq === loadSeq.current) setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(
    () => loadProfile(userRef.current),
    [loadProfile],
  );

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setProfile(null);
      return;
    }

    const supabase = getSupabase();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      // Deferred so the auth client lock is released before querying.
      queueMicrotask(() => void loadProfile(u));
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  return (
    <AuthContext.Provider value={{ user, profile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
