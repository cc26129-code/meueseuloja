import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFavorites } from "@/providers/favorites-provider";
import { useProducts } from "@/hooks/use-products";

export const Route = createFileRoute("/favoritos")({
  head: () => ({
    meta: [
      { title: "Favoritos | meueseuloja" },
      {
        name: "description",
        content:
          "Veja os produtos que você marcou como favoritos na meueseuloja e finalize sua compra quando quiser.",
      },
      { property: "og:title", content: "Favoritos | meueseuloja" },
      {
        property: "og:description",
        content: "Sua seleção pessoal de produtos favoritos da meueseuloja.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Favoritos,
});

function Favoritos() {
  const { products: allProducts, isLoading } = useProducts();
  const { ids } = useFavorites();

  const products = allProducts.filter((p) => ids.includes(p.id));

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto w-full max-w-7xl px-5 pb-24 pt-36 sm:px-8 sm:pt-44">
        <p className="text-[0.65rem] uppercase tracking-luxe text-primary">Seleção pessoal</p>
        <h1 className="mt-5 font-display text-4xl sm:text-5xl">Favoritos</h1>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Os produtos que você marcou com o coração ficam guardados aqui. Ao entrar na sua conta,
          eles também são sincronizados entre seus dispositivos.
        </p>

        <div className="mt-14">
          {isLoading ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="aspect-4/5 w-full rounded-3xl" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-3xl bg-card px-8 py-24 text-center shadow-luxe ring-1 ring-border/70">
              <Heart className="mx-auto size-7 text-primary" />
              <p className="mt-6 font-display text-3xl">Ainda não há favoritos</p>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                Toque no coração de um produto para guardá-lo nesta lista e encontrá-lo com
                facilidade depois.
              </p>
              <Button asChild className="mt-8 rounded-full px-8 tracking-widest">
                <Link to="/">Explorar produtos</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
