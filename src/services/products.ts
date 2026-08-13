import { supabase } from "@/integrations/supabase/client";
import type { Product, ProductWithUrl } from "@/types/product";

export const PRODUCT_IMAGES_BUCKET = "product-images";

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 6;

export type ProductInput = {
  name: string;
  price: number;
  description: string;
  stock_quantity: number;
  image_url: string | null;
};

export async function fetchProducts(): Promise<ProductWithUrl[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const products = (data ?? []) as Product[];
  const paths = products.map((p) => p.image_url).filter((p): p is string => !!p);
  if (paths.length === 0) return products;

  const { data: signed } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  const signedByPath = new Map((signed ?? []).map((s) => [s.path ?? "", s.signedUrl]));

  return products.map((p) => ({
    ...p,
    signedUrl: p.image_url ? (signedByPath.get(p.image_url) ?? null) : null,
  }));
}

export async function uploadProductImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  return path;
}

export async function createProduct(input: ProductInput) {
  const { error } = await supabase.from("products").insert(input);
  if (error) throw error;
}

export async function updateProduct(id: string, input: ProductInput) {
  const { error } = await supabase.from("products").update(input).eq("id", id);
  if (error) throw error;
}

export async function updateProductStock(id: string, stock: number) {
  const { error } = await supabase.from("products").update({ stock_quantity: stock }).eq("id", id);
  if (error) throw error;
}

export async function deleteProduct(product: Pick<Product, "id" | "image_url">) {
  const { error } = await supabase.from("products").delete().eq("id", product.id);
  if (error) throw error;
  if (product.image_url) {
    await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([product.image_url]);
  }
}
