import { useState } from "react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

import { FavoriteButton } from "@/components/products/FavoriteButton";
import { ProductImage } from "@/components/products/ProductImage";
import { QuantityStepper } from "@/components/products/QuantityStepper";
import { StockBadge } from "@/components/products/StockBadge";
import { Button } from "@/components/ui/button";
import { formatBRL, pluralize } from "@/lib/format";
import { useCart } from "@/providers/cart-provider";
import type { ProductWithUrl } from "@/types/product";

export function ProductCard({ product }: { product: ProductWithUrl }) {
  const { add, setOpen, qtyOf } = useCart();
  const stock = Number(product.stock_quantity ?? 0);
  const available = stock > 0;
  const inCart = qtyOf(product.id);
  const remaining = Math.max(0, stock - inCart);
  const [qty, setQty] = useState(1);

  const maxMessage = `Quantidade máxima disponível: ${stock} ${pluralize(stock, "unidade", "unidades")}.`;

  function changeQty(next: number) {
    if (next < 1) return;
    if (next > stock) {
      toast.error(maxMessage);
      return;
    }
    setQty(next);
  }

  function addToCart() {
    if (!available) return;
    if (qty + inCart > stock) {
      toast.error(maxMessage);
      return;
    }
    add(product.id, qty);
    setQty(1);
    setOpen(true);
    toast.success("Adicionado ao carrinho.");
  }

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[1.5rem] bg-card shadow-[0_16px_45px_-34px_rgba(62,35,78,0.55)] ring-1 ring-border/70 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-luxe hover:ring-primary/30">
      <Link
        to="/produto/$id"
        params={{ id: product.id }}
        className="relative block aspect-4/5 overflow-hidden bg-secondary"
        aria-label={`Ver detalhes de ${product.name}`}
      >
        <ProductImage
          product={product}
          className="transition-transform duration-[900ms] ease-out group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-foreground/12 via-transparent to-transparent" />
        <StockBadge
          available={available}
          className="absolute left-4 top-4 text-[0.65rem] tracking-[0.18em]"
        />
        <FavoriteButton id={product.id} name={product.name} className="absolute right-4 top-4" />
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
        <h3 className="font-display text-[1.65rem] font-medium leading-tight">{product.name}</h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {product.description}
        </p>
        <p className="mt-auto pt-3 text-lg font-medium tracking-wide text-primary">
          {formatBRL(Number(product.price))}
        </p>

        {available ? (
          <>
            <p className="text-xs text-muted-foreground">
              {stock} {pluralize(stock, "unidade disponível", "unidades disponíveis")}
              {inCart > 0 ? ` · ${inCart} no carrinho` : ""}
            </p>
            <div className="mt-2 flex items-center gap-3">
              <QuantityStepper
                value={qty}
                onDecrease={() => changeQty(qty - 1)}
                onIncrease={() => changeQty(qty + 1)}
              />
              <Button
                className="flex-1 rounded-full text-xs uppercase tracking-[0.14em]"
                onClick={addToCart}
                disabled={remaining <= 0}
              >
                {remaining <= 0 ? "Limite no carrinho" : "Adicionar"}
              </Button>
            </div>
          </>
        ) : (
          <Button variant="outline" className="mt-2 w-full rounded-full" disabled>
            Esgotado
          </Button>
        )}
      </div>
    </article>
  );
}
