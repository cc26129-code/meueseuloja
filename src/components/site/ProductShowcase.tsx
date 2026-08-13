import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Check, Circle, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/lib/cart";
import { fetchProducts, formatBRL, type ProductWithUrl } from "@/lib/products";

const AUTOPLAY_MS = 3800;

function ShowcaseCard({ product }: { product: ProductWithUrl }) {
  const { add, setOpen, qtyOf } = useCart();
  const stock = Number(product.stock_quantity ?? 0);
  const available = stock > 0;
  const remaining = Math.max(0, stock - qtyOf(product.id));

  function addToCart() {
    if (!available) return;
    if (remaining <= 0) {
      toast.error("Você já adicionou todo o estoque disponível.");
      return;
    }
    add(product.id, 1);
    setOpen(true);
    toast.success("Adicionado ao carrinho.");
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-linear-to-b from-card to-secondary/40 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg">
      <button
        type="button"
        onClick={() => {
          const target = document.getElementById("produtos");
          target?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        aria-label={`Visualizar ${product.name}`}
        className="relative block aspect-4/3 w-full overflow-hidden bg-secondary"
      >
        {product.signedUrl ? (
          <img
            src={product.signedUrl}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
          />
        ) : (
          <span className="grid size-full place-items-center text-muted-foreground">
            <Sparkles className="size-7" />
          </span>
        )}
        <span
          className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.6rem] uppercase tracking-[0.16em] backdrop-blur ${
            available ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"
          }`}
        >
          {available ? <Check className="size-3" /> : <Circle className="size-3" />}
          {available ? "Disponível" : "Esgotado"}
        </span>
      </button>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-xl leading-tight">{product.name}</h3>
        <p className="text-base tracking-wide text-primary">{formatBRL(Number(product.price))}</p>
        <Button
          className="mt-3 w-full rounded-full tracking-widest"
          variant={available ? "default" : "outline"}
          disabled={!available || remaining <= 0}
          onClick={addToCart}
        >
          {!available ? "Esgotado" : remaining <= 0 ? "Limite no carrinho" : "Adicionar"}
        </Button>
      </div>
    </article>
  );
}

export function ProductShowcase() {
  const { data, isLoading } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const products = (data ?? []) as ProductWithUrl[];

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start", dragFree: false });
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);
  const [paused, setPaused] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setSnaps(emblaApi.scrollSnapList());
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", () => {
      setSnaps(emblaApi.scrollSnapList());
      onSelect();
    });
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi || paused || products.length < 2) return;
    const id = window.setInterval(() => emblaApi.scrollNext(), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [emblaApi, paused, products.length]);

  if (!isLoading && products.length === 0) return null;

  return (
    <section
      aria-label="Vitrine de destaques"
      className="border-b border-border bg-linear-to-b from-background to-secondary/20"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute left-2 top-1/2 z-[60] size-10 -translate-y-1/2 rounded-full lg:left-4"
            aria-label="Produto anterior"
            onClick={() => emblaApi?.scrollPrev()}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute right-2 top-1/2 z-[60] size-10 -translate-y-1/2 rounded-full lg:right-4"
            aria-label="Próximo produto"
            onClick={() => emblaApi?.scrollNext()}
          >
            <ChevronRight className="size-4" />
          </Button>

          <div className="-mx-5 overflow-hidden sm:-mx-8" ref={emblaRef}>
            <div className="flex touch-pan-y gap-5 pl-12 pr-12 sm:pl-12 sm:pr-12 lg:pl-14 lg:pr-14">
            {isLoading
              ? [0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="min-w-0 shrink-0 basis-[80%] sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                  >
                    <Skeleton className="aspect-4/3 w-full rounded-3xl" />
                  </div>
                ))
              : products.map((p) => (
                  <div
                    key={p.id}
                    className="min-w-0 shrink-0 basis-[80%] sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                  >
                    <ShowcaseCard product={p} />
                  </div>
                ))}
          </div>
        </div>
        </div>

        {snaps.length > 1 ? (
          <div className="mt-6 flex justify-center gap-2">
            {snaps.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ir para o slide ${i + 1}`}
                onClick={() => emblaApi?.scrollTo(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === selected ? "w-6 bg-primary" : "w-1.5 bg-border hover:bg-primary/50"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
