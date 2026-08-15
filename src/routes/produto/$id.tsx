import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, PackageCheck, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { FavoriteButton } from "@/components/products/FavoriteButton";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductImage } from "@/components/products/ProductImage";
import { QuantityStepper } from "@/components/products/QuantityStepper";
import { StockBadge } from "@/components/products/StockBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts } from "@/hooks/use-products";
import { formatBRL, pluralize } from "@/lib/format";
import { useCart } from "@/providers/cart-provider";

export const Route = createFileRoute("/produto/$id")({
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { products, isLoading } = useProducts();
  const { add, setOpen, qtyOf } = useCart();
  const [qty, setQty] = useState(1);
  const product = products.find((item) => item.id === id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto grid w-full max-w-7xl gap-10 px-5 pb-24 pt-36 sm:px-8 lg:grid-cols-2">
          <Skeleton className="aspect-4/5 w-full rounded-3xl" />
          <div className="space-y-5 py-8">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-28 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto grid min-h-[70vh] max-w-3xl place-items-center px-5 pt-28 text-center">
          <div>
            <Sparkles className="mx-auto size-8 text-primary" />
            <h1 className="mt-6 text-4xl">Produto não encontrado</h1>
            <Button asChild className="mt-8 rounded-full">
              <Link to="/">Voltar à coleção</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const stock = Number(product.stock_quantity ?? 0);
  const inCart = qtyOf(product.id);
  const remaining = Math.max(0, stock - inCart);
  const suggestions = products.filter((item) => item.id !== product.id).slice(0, 3);

  function changeQty(next: number) {
    if (next < 1) return;
    if (next > stock) {
      toast.error(
        `Quantidade máxima disponível: ${stock} ${pluralize(stock, "unidade", "unidades")}.`,
      );
      return;
    }
    setQty(next);
  }

  function addToCart() {
    if (qty + inCart > stock) {
      toast.error("A quantidade escolhida ultrapassa o estoque disponível.");
      return;
    }
    add(product.id, qty);
    setQty(1);
    setOpen(true);
    toast.success("Adicionado ao carrinho.");
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pb-24 pt-32 sm:pt-40">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="size-3.5" /> Voltar à coleção
          </Link>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div className="relative aspect-4/5 overflow-hidden rounded-3xl bg-secondary shadow-luxe ring-1 ring-border/70">
              <ProductImage
                product={product}
                className="transition-transform duration-700 hover:scale-[1.02]"
              />
              <StockBadge available={stock > 0} className="absolute left-5 top-5" />
              <FavoriteButton
                id={product.id}
                name={product.name}
                className="absolute right-5 top-5"
              />
            </div>

            <section className="flex flex-col justify-center lg:py-8">
              <p className="text-[0.65rem] uppercase tracking-luxe text-primary">
                Coleção meueseuloja
              </p>
              <h1 className="mt-4 font-display text-5xl font-medium leading-none sm:text-6xl">
                {product.name}
              </h1>
              <p className="mt-6 text-2xl font-medium text-primary">
                {formatBRL(Number(product.price))}
              </p>
              <p className="mt-8 whitespace-pre-line text-sm leading-7 text-muted-foreground sm:text-base">
                {product.description}
              </p>

              {stock > 0 ? (
                <div className="mt-9 border-y border-border/70 py-6">
                  <p className="mb-4 text-xs text-muted-foreground">
                    {stock} {pluralize(stock, "unidade disponível", "unidades disponíveis")}
                    {inCart > 0 ? ` · ${inCart} no carrinho` : ""}
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <QuantityStepper
                      value={qty}
                      onDecrease={() => changeQty(qty - 1)}
                      onIncrease={() => changeQty(qty + 1)}
                    />
                    <Button
                      className="h-12 flex-1 rounded-full text-xs uppercase tracking-[0.16em]"
                      onClick={addToCart}
                      disabled={remaining <= 0}
                    >
                      {remaining <= 0 ? "Limite no carrinho" : "Adicionar ao carrinho"}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" className="mt-9 rounded-full" disabled>
                  Produto esgotado
                </Button>
              )}

              <div className="mt-6 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                <span className="flex items-center gap-2">
                  <Truck className="size-4 text-primary" /> Frete no checkout
                </span>
                <span className="flex items-center gap-2">
                  <PackageCheck className="size-4 text-primary" /> Estoque real
                </span>
                <span className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" /> Compra segura
                </span>
              </div>
            </section>
          </div>
        </div>

        {suggestions.length > 0 && (
          <section className="mx-auto mt-24 w-full max-w-7xl border-t border-border/70 px-5 pt-20 sm:px-8">
            <p className="text-center text-[0.65rem] uppercase tracking-luxe text-primary">
              Continue explorando
            </p>
            <h2 className="mt-4 text-center text-4xl font-medium sm:text-5xl">
              Você também pode gostar
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {suggestions.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
