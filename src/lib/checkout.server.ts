import type { OrderItem } from "./orders";

type DbProduct = { id: string; name: string; price: number; stock_quantity: number };

/**
 * Rebuilds the order from database prices. Anything sent by the browser other
 * than the product id and quantity is ignored.
 */
export function buildOrderItems(
  requested: { id: string; qty: number }[],
  products: DbProduct[],
): { items: OrderItem[]; subtotal: number; subtotalCents: number } {
  const byId = new Map(products.map((p) => [p.id, p]));
  const merged = new Map<string, number>();
  for (const item of requested) {
    merged.set(item.id, (merged.get(item.id) ?? 0) + item.qty);
  }

  const items: OrderItem[] = [];
  for (const [id, qty] of merged) {
    const product = byId.get(id);
    if (!product) throw new Error("Um dos produtos não está mais disponível.");
    if (qty > Number(product.stock_quantity)) {
      throw new Error(
        `Quantidade indisponível para ${product.name}. Disponível agora: ${product.stock_quantity}.`,
      );
    }
    const unitPriceCents = toCents(product.price);
    const unitPrice = fromCents(unitPriceCents);
    const subtotal = fromCents(unitPriceCents * qty);
    items.push({
      product_id: product.id,
      name: product.name,
      unit_price: unitPrice,
      quantity: qty,
      subtotal,
    });
  }

  if (items.length === 0) throw new Error("Carrinho vazio.");

  const subtotalCents = items.reduce((sum, item) => sum + toCents(item.subtotal), 0);
  if (subtotalCents <= 0) throw new Error("Valor do pedido inválido.");

  return { items, subtotal: fromCents(subtotalCents), subtotalCents };
}

export function toCents(value: number) {
  const cents = Math.round(Number(value) * 100);
  if (!Number.isSafeInteger(cents) || cents < 0) throw new Error("Valor financeiro inválido.");
  return cents;
}

export function fromCents(cents: number) {
  if (!Number.isSafeInteger(cents) || cents < 0) throw new Error("Valor financeiro inválido.");
  return cents / 100;
}

export function resolveSiteOrigin(requestUrl: string): string {
  const configured = process.env["PUBLIC_SITE_URL"];
  if (configured) return configured.replace(/\/$/, "");
  return new URL(requestUrl).origin;
}
