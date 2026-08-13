import type { StockStatus } from "@/types/product";

/** Acima deste valor o produto é considerado plenamente disponível. */
export const LOW_STOCK_THRESHOLD = 5;

export function stockStatus(qty: number): StockStatus {
  if (qty <= 0) return "out_of_stock";
  if (qty <= LOW_STOCK_THRESHOLD) return "low_stock";
  return "in_stock";
}

export const stockStatusLabel: Record<StockStatus, string> = {
  in_stock: "Disponível",
  low_stock: "Estoque baixo",
  out_of_stock: "Esgotado",
};
