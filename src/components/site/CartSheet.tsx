import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { fetchProducts, formatBRL, type ProductWithUrl } from "@/lib/products";

export function CartSheet() {
  const { items, open, setOpen, setQty, remove, clear } = useCart();
  const { data } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const products = (data ?? []) as ProductWithUrl[];
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines = items
    .map((i) => ({ item: i, product: byId.get(i.id) }))
    .filter((l): l is { item: typeof l.item; product: ProductWithUrl } => !!l.product);

  const total = lines.reduce((sum, l) => sum + Number(l.product.price) * l.item.qty, 0);
  const hasIssue = lines.some((l) => l.item.qty > l.product.stock_quantity);

  function inc(productId: string, current: number, stock: number) {
    if (current + 1 > stock) {
      toast.error(`Quantidade máxima disponível: ${stock} unidade${stock === 1 ? "" : "s"}.`);
      return;
    }
    setQty(productId, current + 1);
  }

  function checkout() {
    const stale = lines.find((l) => l.item.qty > l.product.stock_quantity);
    if (stale) {
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
      <SheetContent side="right" className="flex w-full flex-col border-border bg-card sm:max-w-md">
        <SheetHeader className="px-6">
          <SheetTitle className="font-display text-3xl">Seu carrinho</SheetTitle>
          <SheetDescription>
            O estoque é controlado pela loja; nada é reservado automaticamente.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 pb-4">
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
                  className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 rounded-2xl border border-border bg-background/60 p-3 shadow-soft"
                >
                  <div className="aspect-square overflow-hidden rounded-xl bg-secondary">
                    {product.signedUrl ? (
                      <img
                        src={product.signedUrl}
                        alt={product.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="grid size-full place-items-center text-muted-foreground">
                        <ShoppingBag className="size-4" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-display text-xl">{product.name}</p>
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
                      <div className="flex items-center gap-1 rounded-full border border-border p-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-full"
                          aria-label="Diminuir"
                          onClick={() => setQty(item.id, item.qty - 1)}
                        >
                          <Minus className="size-3.5" />
                        </Button>
                        <span className="w-6 text-center text-sm">{item.qty}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-full"
                          aria-label="Aumentar"
                          onClick={() => inc(item.id, item.qty, product.stock_quantity)}
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>
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
          <div className="space-y-4 border-t border-border px-6 py-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-luxe text-muted-foreground">Total</span>
              <span className="font-display text-3xl text-primary">{formatBRL(total)}</span>
            </div>
            <Button className="w-full rounded-full" disabled={hasIssue} onClick={checkout}>
              Enviar pedido
            </Button>
            <Button variant="ghost" className="w-full rounded-full" onClick={clear}>
              Esvaziar carrinho
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
