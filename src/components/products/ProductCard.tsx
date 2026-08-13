import { Check, Circle, Minus, Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/site/FavoriteButton";
import { useCart } from "@/lib/cart";
import { formatBRL, type ProductWithUrl } from "@/lib/products";

export function ProductCard({ product }: { product: ProductWithUrl }) {
  const { add, setOpen, qtyOf } = useCart();
  const stock = Number(product.stock_quantity ?? 0);
  const available = stock > 0;
  const inCart = qtyOf(product.id);
  const remaining = Math.max(0, stock - inCart);
  const [qty, setQty] = useState(1);

  function changeQty(next: number) {
    if (next < 1) return;
    if (next > stock) {
      toast.error(`Quantidade máxima disponível: ${stock} unidade${stock === 1 ? "" : "s"}.`);
      return;
    }
    setQty(next);
  }

  function addToCart() {
    if (!available) return;
    if (qty + inCart > stock) {
      toast.error(`Quantidade máxima disponível: ${stock} unidade${stock === 1 ? "" : "s"}.`);
      return;
    }
    add(product.id, qty);
    setQty(1);
    setOpen(true);
    toast.success("Adicionado ao carrinho.");
  }

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-gold">
      <div className="relative aspect-4/3 overflow-hidden bg-secondary">
        {product.signedUrl ? (
          <img
            src={product.signedUrl}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <Sparkles className="size-8" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-background/70 to-transparent opacity-70" />
        <span
          className={`absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em] backdrop-blur ${
            available ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"
          }`}
        >
          {available ? <Check className="size-3" /> : <Circle className="size-3" />}
          {available ? "Disponível" : "Esgotado"}
        </span>
        <FavoriteButton id={product.id} name={product.name} className="absolute right-4 top-4" />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <h3 className="font-display text-2xl leading-tight">{product.name}</h3>
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {product.description}
        </p>
        <p className="mt-auto pt-4 text-lg tracking-wide text-primary">
          {formatBRL(Number(product.price))}
        </p>

        {available ? (
          <>
            <p className="text-xs text-muted-foreground">
              {stock} {stock === 1 ? "unidade disponível" : "unidades disponíveis"}
              {inCart > 0 ? ` · ${inCart} no carrinho` : ""}
            </p>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex items-center gap-1 rounded-full border border-border p-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full"
                  aria-label="Diminuir quantidade"
                  onClick={() => changeQty(qty - 1)}
                >
                  <Minus className="size-3.5" />
                </Button>
                <span className="w-7 text-center text-sm">{qty}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full"
                  aria-label="Aumentar quantidade"
                  onClick={() => changeQty(qty + 1)}
                >
                  <Plus className="size-3.5" />
                </Button>
              </div>
              <Button
                className="flex-1 rounded-full tracking-widest"
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
