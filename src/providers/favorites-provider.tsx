import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { readJSON, writeJSON } from "@/lib/storage";

const STORAGE_KEY = "meueseuloja:favorites:v1";

type FavoritesContextValue = {
  ids: string[];
  count: number;
  isFavorite: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function parseIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((i): i is string => typeof i === "string");
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setIds(parseIds(readJSON(STORAGE_KEY)));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeJSON(STORAGE_KEY, ids);
  }, [ids, hydrated]);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      ids,
      count: ids.length,
      isFavorite: (id) => ids.includes(id),
      toggle: (id) =>
        setIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])),
      remove: (id) => setIds((prev) => prev.filter((i) => i !== id)),
      clear: () => setIds([]),
    }),
    [ids],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites deve ser usado dentro de FavoritesProvider");
  return ctx;
}
