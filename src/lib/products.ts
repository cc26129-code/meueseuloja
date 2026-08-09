import { supabase } from "@/integrations/supabase/client";

export type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export const BUCKET = "product-images";

export function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const products = (data ?? []) as Product[];
  const paths = products.map((p) => p.image_url).filter((p): p is string => !!p);
  if (paths.length === 0) return products;

  const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 60 * 60 * 6);
  const map = new Map((signed ?? []).map((s) => [s.path ?? "", s.signedUrl]));
  return products.map((p) => ({
    ...p,
    signedUrl: p.image_url ? (map.get(p.image_url) ?? null) : null,
  })) as Product[];
}

export type ProductWithUrl = Product & { signedUrl?: string | null };

export async function uploadProductImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  return path;
}
