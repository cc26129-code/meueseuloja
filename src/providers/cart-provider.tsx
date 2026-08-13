import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = { id: string; qty: number };

const STORAGE_KEY = "meueseuloja:cart:v1";

type CartContextValue = {
  items: CartItem[];
  count: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  qtyOf: (id: string) => number;
  add: (id: string, qty: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((i) => i && typeof i.id === "string" && Number.isFinite(Number(i.qty)))
      .map((i) => ({ id: i.id as string, qty: Math.max(1, Math.floor(Number(i.qty))) }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(read());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore quota errors */
    }
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const qtyOf = (id: string) => items.find((i) => i.id === id)?.qty ?? 0;
    return {
      items,
      open,
      setOpen,
      count: items.reduce((sum, i) => sum + i.qty, 0),
      qtyOf,
      add: (id, qty) =>
        setItems((prev) => {
          const existing = prev.find((i) => i.id === id);
          if (existing) {
            return prev.map((i) => (i.id === id ? { ...i, qty: i.qty + qty } : i));
          }
          return [...prev, { id, qty }];
        }),
      setQty: (id, qty) =>
        setItems((prev) =>
          qty <= 0
            ? prev.filter((i) => i.id !== id)
            : prev.map((i) => (i.id === id ? { ...i, qty } : i)),
        ),
      remove: (id) => setItems((prev) => prev.filter((i) => i.id !== id)),
      clear: () => setItems([]),
    };
  }, [items, open]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de CartProvider");
  return ctx;
}
