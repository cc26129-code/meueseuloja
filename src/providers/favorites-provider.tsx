import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import { readJSON, removeJSON, writeJSON } from "@/lib/storage";
import { useAuth } from "@/providers/auth-provider";

const STORAGE_KEY = "meueseuloja:favorites:v1";
type FavoritesContextValue = {
  ids: string[];
  count: number;
  syncing: boolean;
  isFavorite: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
};
const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function parseIds(raw: unknown): string[] {
  return Array.isArray(raw)
    ? [...new Set(raw.filter((id): id is string => typeof id === "string"))]
    : [];
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    setReady(false);
    if (!user) {
      setIds(parseIds(readJSON(STORAGE_KEY)));
      setReady(true);
      return () => {
        active = false;
      };
    }
    void (async () => {
      const { data } = await supabase.from("favorites").select("product_id").eq("user_id", user.id);
      if (!active) return;
      const guest = parseIds(readJSON(STORAGE_KEY));
      const merged = [...new Set([...(data ?? []).map((row) => row.product_id), ...guest])];
      if (guest.length > 0) {
        await supabase.from("favorites").upsert(
          merged.map((productId) => ({ user_id: user.id, product_id: productId })),
          { onConflict: "user_id,product_id" },
        );
        removeJSON(STORAGE_KEY);
      }
      if (active) {
        setIds(merged);
        setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [authLoading, user]);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      writeJSON(STORAGE_KEY, ids);
      return;
    }
    const timer = window.setTimeout(() => {
      void (async () => {
        await supabase.from("favorites").delete().eq("user_id", user.id);
        if (ids.length > 0)
          await supabase
            .from("favorites")
            .insert(ids.map((productId) => ({ user_id: user.id, product_id: productId })));
      })();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [ids, ready, user]);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      ids,
      count: ids.length,
      syncing: authLoading || !ready,
      isFavorite: (id) => ids.includes(id),
      toggle: (id) =>
        setIds((current) =>
          current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
        ),
      remove: (id) => setIds((current) => current.filter((item) => item !== id)),
      clear: () => setIds([]),
    }),
    [authLoading, ids, ready],
  );
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites deve ser usado dentro de FavoritesProvider");
  return context;
}
