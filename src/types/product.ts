export type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  image_url: string | null;
  stock_quantity: number;
  weight_kg: number | null;
  height_cm: number | null;
  width_cm: number | null;
  length_cm: number | null;
  created_at: string;
  updated_at: string;
};

/** Produto com a URL assinada da imagem já resolvida para exibição. */
export type ProductWithUrl = Product & { signedUrl?: string | null };

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";
