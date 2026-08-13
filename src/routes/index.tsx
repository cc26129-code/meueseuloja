import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles } from "lucide-react";

import heroImage from "@/assets/hero.jpg";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ProductShowcase } from "@/components/site/ProductShowcase";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchProducts, type ProductWithUrl } from "@/lib/products";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "meueseuloja | Vitrine premium de produtos selecionados" },
      {
        name: "description",
        content:
          "Conheça a meueseuloja: curadoria premium de produtos com acabamento impecável, fotos reais e atendimento próximo.",
      },
      { property: "og:title", content: "meueseuloja | Vitrine premium" },
      {
        property: "og:description",
        content: "Curadoria premium de produtos selecionados com cuidado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const products = (data ?? []) as ProductWithUrl[];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main id="topo">
        <ProductShowcase />

        <section className="relative flex min-h-[92vh] items-center overflow-hidden">
          <img
            src={heroImage}
            alt="Fundo elegante em preto e lilás"
            width={1920}
            height={1088}
            className="absolute inset-0 size-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-linear-to-r from-background via-background/80 to-background/20" />
          <div className="relative mx-auto w-full max-w-7xl px-5 py-32 sm:px-8">
            <p className="text-[0.65rem] uppercase tracking-luxe text-primary">
              Curadoria · Elegância · Exclusividade
            </p>
            <h1 className="mt-8 max-w-3xl font-display text-5xl leading-[1.05] sm:text-7xl lg:text-8xl">
              Peças que carregam <span className="text-gold-gradient">presença</span>
            </h1>
            <p className="mt-8 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Na meueseuloja cada produto é escolhido a dedo: materiais nobres, acabamento
              impecável e uma vitrine feita para quem aprecia o detalhe.
            </p>
            <div className="mt-12 flex flex-wrap gap-4">
              <Button asChild size="lg" className="rounded-full px-10 tracking-widest">
                <a href="#produtos">
                  Ver produtos <ArrowRight className="ml-2 size-4" />
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full px-10 tracking-widest"
              >
                <a href="#sobre">Sobre a loja</a>
              </Button>
            </div>
          </div>
        </section>

        <section id="produtos" className="mx-auto w-full max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
          <div className="max-w-2xl">
            <p className="text-[0.65rem] uppercase tracking-luxe text-primary">Coleção</p>
            <h2 className="mt-5 font-display text-4xl sm:text-5xl">Nossos produtos</h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              Uma vitrine viva: tudo o que você vê aqui está disponível e é atualizado
              constantemente.
            </p>
          </div>

          <div className="mt-14">
            {isLoading ? (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded-2xl border border-border bg-card p-0">
                    <Skeleton className="aspect-4/3 w-full rounded-2xl" />
                    <div className="space-y-3 p-6">
                      <Skeleton className="h-6 w-2/3" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Não foi possível carregar os produtos agora. Tente novamente em instantes.
              </p>
            ) : products.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card px-8 py-24 text-center">
                <Sparkles className="mx-auto size-7 text-primary" />
                <p className="mt-6 font-display text-3xl">Novidades a caminho</p>
                <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                  Nossa curadoria está sendo finalizada. Em breve novos produtos estarão disponíveis
                  nesta vitrine.
                </p>
              </div>
            ) : (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="sobre" className="border-y border-border bg-night">
          <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-24 sm:px-8 md:grid-cols-2">
            <h2 className="font-display text-4xl sm:text-5xl">
              Sobre a <span className="text-gold-gradient">meueseuloja</span>
            </h2>
            <div className="space-y-5 text-sm leading-relaxed text-muted-foreground">
              <p>
                Nascemos de um gosto simples: o de oferecer poucas peças, bem escolhidas. Nada de
                catálogo infinito, apenas o que vale a pena.
              </p>
              <p>
                Cada item passa por avaliação de material, acabamento e durabilidade antes de entrar
                na vitrine. O atendimento é direto, humano e sem intermediários.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
