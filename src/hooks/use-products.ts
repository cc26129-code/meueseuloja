import { queryOptions, useQuery } from "@tanstack/react-query";

import { fetchProducts } from "@/services/products";
import type { ProductWithUrl } from "@/types/product";

export const PRODUCTS_QUERY_KEY = ["products"] as const;

export const productsQueryOptions = queryOptions({
  queryKey: PRODUCTS_QUERY_KEY,
  queryFn: fetchProducts,
});

/** Lista de produtos compartilhada por vitrine, carrinho, favoritos e painel. */
export function useProducts() {
  const query = useQuery(productsQueryOptions);
  const products: ProductWithUrl[] = query.data ?? [];
  return { ...query, products };
}
