import { useNavigate } from "@tanstack/react-router";
import { LockKeyhole, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ProductImage } from "@/components/products/ProductImage";
import { QuantityStepper } from "@/components/products/QuantityStepper";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useCartLines } from "@/hooks/use-cart-lines";
import { formatBRL, pluralize } from "@/lib/format";
import { useCart } from "@/providers/cart-provider";

export function CartSheet() {
  const navigate = useNavigate();
  const { open, setOpen, setQty, remove, clear } = useCart();
  const { lines, total, hasStockIssue } = useCartLines();

  function increase(productId: string, current: number, stock: number) {
    if (current + 1 > stock) {
      toast.error(
        `Quantidade máxima disponível: ${stock} ${pluralize(stock, "unidade", "unidades")}.`,
      );
      return;
    }
    setQty(productId, current + 1);
  }

  function goToCheckout() {
    if (hasStockIssue) {
      toast.error(
        "A quantidade disponível deste produto foi alterada. Atualize a quantidade do seu carrinho.",
      );
      return;
    }
    setOpen(false);
    void navigate({ to: "/checkout" });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="flex w-full flex-col border-border/70 bg-background p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border/70 bg-card px-6 pb-5 pt-7">
          <SheetTitle className="font-display text-3xl font-medium">Seu carrinho</SheetTitle>
          <SheetDescription>
            O estoque é controlado pela loja; nada é reservado automaticamente.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5 sm:px-6">
          {lines.length === 0 ? (
            <div className="grid place-items-center gap-4 py-20 text-center">
              <ShoppingBag className="size-8 text-primary" />
              <p className="text-sm text-muted-foreground">Seu carrinho está vazio.</p>
            </div>
          ) : (
            lines.map(({ item, product }) => {
              const over = item.qty > product.stock_quantity;
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[5rem_minmax(0,1fr)] gap-4 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-border/70"
                >
                  <div className="aspect-square overflow-hidden rounded-xl bg-secondary">
                    <ProductImage product={product} fallback={<ShoppingBag className="size-4" />} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-display text-xl font-medium">{product.name}</p>
                      <button
                        type="button"
                        aria-label={`Remover ${product.name}`}
                        onClick={() => remove(item.id)}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatBRL(Number(product.price))} / unidade
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <QuantityStepper
                        size="sm"
                        value={item.qty}
                        decreaseLabel="Diminuir"
                        increaseLabel="Aumentar"
                        onDecrease={() => setQty(item.id, item.qty - 1)}
                        onIncrease={() => increase(item.id, item.qty, product.stock_quantity)}
                      />
                      <p className="text-sm text-primary">
                        {formatBRL(Number(product.price) * item.qty)}
                      </p>
                    </div>

                    {over && (
                      <p className="mt-2 text-xs text-destructive">
                        Disponível agora: {product.stock_quantity}. Atualize a quantidade.
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {lines.length > 0 && (
          <div className="space-y-4 border-t border-border bg-card px-6 py-5 shadow-[0_-12px_30px_-28px_rgba(62,35,78,0.55)]">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-luxe text-muted-foreground">Total</span>
              <span className="font-display text-3xl text-primary">{formatBRL(total)}</span>
            </div>
            <Button className="w-full rounded-full" disabled={hasStockIssue} onClick={goToCheckout}>
              Finalizar e pagar com PIX
            </Button>
            <p className="flex items-center justify-center gap-2 text-[0.7rem] text-muted-foreground">
              <LockKeyhole className="size-3.5 text-primary" /> Pagamento e dados protegidos
            </p>
            <Button variant="ghost" className="w-full rounded-full" onClick={clear}>
              Esvaziar carrinho
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
