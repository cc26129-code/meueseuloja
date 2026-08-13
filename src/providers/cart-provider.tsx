import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import { readJSON, removeJSON, writeJSON } from "@/lib/storage";
import { useAuth } from "@/providers/auth-provider";

export type CartItem = { id: string; qty: number };
const STORAGE_KEY = "meueseuloja:cart:v1";

type CartContextValue = {
  items: CartItem[];
  count: number;
  open: boolean;
  syncing: boolean;
  setOpen: (v: boolean) => void;
  qtyOf: (id: string) => number;
  add: (id: string, qty: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function parseItems(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => item && typeof item.id === "string" && Number.isFinite(Number(item.qty)))
    .map((item) => ({
      id: item.id as string,
      qty: Math.min(99, Math.max(1, Math.floor(Number(item.qty)))),
    }));
}

function mergeItems(server: CartItem[], local: CartItem[]) {
  const merged = new Map(server.map((item) => [item.id, item.qty]));
  for (const item of local) merged.set(item.id, Math.max(merged.get(item.id) ?? 0, item.qty));
  return [...merged].map(([id, qty]) => ({ id, qty }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    setReady(false);
    if (!user) {
      setItems(parseItems(readJSON(STORAGE_KEY)));
      setReady(true);
      return () => {
        active = false;
      };
    }
    void (async () => {
      const { data } = await supabase
        .from("cart_items")
        .select("product_id, quantity")
        .eq("user_id", user.id);
      if (!active) return;
      const server = (data ?? []).map((row) => ({ id: row.product_id, qty: row.quantity }));
      const guest = parseItems(readJSON(STORAGE_KEY));
      const merged = mergeItems(server, guest);
      if (guest.length > 0) {
        await supabase.from("cart_items").upsert(
          merged.map((item) => ({ user_id: user.id, product_id: item.id, quantity: item.qty })),
          { onConflict: "user_id,product_id,variant_key" },
        );
        removeJSON(STORAGE_KEY);
      }
      if (active) {
        setItems(merged);
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
      writeJSON(STORAGE_KEY, items);
      return;
    }
    const timer = window.setTimeout(() => {
      void (async () => {
        await supabase.from("cart_items").delete().eq("user_id", user.id);
        if (items.length > 0) {
          await supabase
            .from("cart_items")
            .insert(
              items.map((item) => ({ user_id: user.id, product_id: item.id, quantity: item.qty })),
            );
        }
      })();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [items, ready, user]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      open,
      syncing: authLoading || !ready,
      setOpen,
      count: items.reduce((sum, item) => sum + item.qty, 0),
      qtyOf: (id) => items.find((item) => item.id === id)?.qty ?? 0,
      add: (id, qty) =>
        setItems((current) =>
          current.some((item) => item.id === id)
            ? current.map((item) =>
                item.id === id ? { ...item, qty: Math.min(99, item.qty + qty) } : item,
              )
            : [...current, { id, qty }],
        ),
      setQty: (id, qty) =>
        setItems((current) =>
          qty <= 0
            ? current.filter((item) => item.id !== id)
            : current.map((item) => (item.id === id ? { ...item, qty: Math.min(99, qty) } : item)),
        ),
      remove: (id) => setItems((current) => current.filter((item) => item.id !== id)),
      clear: () => setItems([]),
    }),
    [authLoading, items, open, ready],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart deve ser usado dentro de CartProvider");
  return context;
}
