import { useCart } from "@/providers/cart-provider";
import { useProducts } from "@/hooks/use-products";
import type { CartItem } from "@/providers/cart-provider";
import type { ProductWithUrl } from "@/types/product";

export type CartLine = { item: CartItem; product: ProductWithUrl };

/**
 * Cruza os itens do carrinho com os produtos carregados, descartando itens
 * cujo produto não existe mais e calculando total e conflitos de estoque.
 */
export function useCartLines() {
  const { items } = useCart();
  const { products } = useProducts();

  const byId = new Map(products.map((p) => [p.id, p]));
  const lines: CartLine[] = items
    .map((item) => ({ item, product: byId.get(item.id) }))
    .filter((line): line is CartLine => !!line.product);

  const total = lines.reduce((sum, l) => sum + Number(l.product.price) * l.item.qty, 0);
  const hasStockIssue = lines.some((l) => l.item.qty > l.product.stock_quantity);

  return { lines, total, hasStockIssue };
}
