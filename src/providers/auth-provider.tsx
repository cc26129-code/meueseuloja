import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types/account";
import { isAdmin } from "@/services/roles";

type SignUpInput = { fullName: string; email: string; password: string; address?: string };

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<{ needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const AVATAR_BUCKET = "avatars";

async function loadAccount(user: User): Promise<{ profile: Profile; isAdmin: boolean }> {
  const [{ data: row, error }, { data: role }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, avatar_path")
      .eq("id", user.id)
      .single(),
    isAdmin(user.id),
  ]);
  if (error || !row) throw error ?? new Error("Perfil não encontrado.");

  const { data: address } = await supabase
    .from("addresses")
    .select("id, address_text")
    .eq("user_id", user.id)
    .eq("is_default", true)
    .maybeSingle();

  let avatarUrl: string | null = null;
  if (row.avatar_path) {
    const { data } = await supabase.storage
      .from(AVATAR_BUCKET)
      .createSignedUrl(row.avatar_path, 3600);
    avatarUrl = data?.signedUrl ?? null;
  }

  return {
    profile: {
      id: row.id,
      full_name: row.full_name,
      email: row.email,
      avatar_path: row.avatar_path,
      avatar_url: avatarUrl,
      address_id: address?.id ?? null,
      address: address?.address_text ?? "",
    },
    isAdmin: Boolean(role),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback(async (next: Session | null) => {
    setSession(next);
    if (!next?.user) {
      setProfile(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    try {
      const account = await loadAccount(next.user);
      setProfile(account.profile);
      setIsAdmin(account.isAdmin);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) void applySession(data.session);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      if (active) void applySession(next);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [applySession]);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return;
    const account = await loadAccount(session.user);
    setProfile(account.profile);
    setIsAdmin(account.isAdmin);
  }, [session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isAdmin,
      loading,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      },
      signUp: async ({ fullName, email, password, address }) => {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim(), address: address?.trim() ?? "" } },
        });
        if (error) throw error;
        return { needsEmailConfirmation: !data.session };
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
      refreshProfile,
    }),
    [isAdmin, loading, profile, refreshProfile, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return value;
}
