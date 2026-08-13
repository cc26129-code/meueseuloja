import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

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

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((i): i is string => typeof i === "string");
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setIds(read());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      /* ignore quota errors */
    }
  }, [ids, hydrated]);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      ids,
      count: ids.length,
      isFavorite: (id: string) => ids.includes(id),
      toggle: (id: string) =>
        setIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])),
      remove: (id: string) => setIds((prev) => prev.filter((i) => i !== id)),
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
