import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, LockKeyhole, PackageCheck, QrCode, Sparkles } from "lucide-react";

import heroImage from "@/assets/hero.jpg";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductShowcase } from "@/components/products/ProductShowcase";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts } from "@/hooks/use-products";

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
  const { products, isLoading, isError } = useProducts();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main id="topo">
        <section className="relative flex min-h-[88vh] items-center overflow-hidden pt-24 sm:min-h-[92vh]">
          <img
            src={heroImage}
            alt="Fundo elegante em preto e lilás"
            width={1920}
            height={1088}
            className="absolute inset-0 size-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-linear-to-r from-[#faf7fc] via-[#faf7fc]/88 to-[#faf7fc]/18 dark:from-[#110c16] dark:via-[#110c16]/88 dark:to-[#110c16]/20" />
          <div className="absolute inset-0 bg-linear-to-t from-background/55 via-transparent to-transparent" />
          <div className="relative mx-auto w-full max-w-7xl px-5 py-28 sm:px-8 lg:py-36">
            <p className="text-[0.65rem] font-medium uppercase tracking-luxe text-primary">
              Curadoria · Elegância · Exclusividade
            </p>
            <h1 className="mt-7 max-w-3xl font-display text-5xl font-medium leading-[0.98] sm:text-7xl lg:text-[6.5rem]">
              Detalhes que tornam o <span className="text-gold-gradient">cotidiano especial</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Uma seleção cuidadosa de peças com personalidade, acabamento bonito e atendimento
              próximo em cada etapa da compra.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full px-8 text-xs uppercase tracking-[0.16em]"
              >
                <a href="#produtos">
                  Conhecer a coleção <ArrowRight className="ml-1 size-4" />
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full px-8 text-xs uppercase tracking-[0.16em]"
              >
                <a href="#sobre">Sobre a loja</a>
              </Button>
            </div>
          </div>
        </section>

        <section aria-label="Vantagens da loja" className="border-y border-border/70 bg-card">
          <div className="mx-auto grid w-full max-w-7xl gap-px px-5 sm:grid-cols-3 sm:px-8">
            {[
              { icon: PackageCheck, title: "Envio calculado", text: "Opções e prazos no checkout" },
              { icon: QrCode, title: "Pagamento via PIX", text: "Confirmação automática e segura" },
              {
                icon: LockKeyhole,
                title: "Compra protegida",
                text: "Seus dados permanecem seguros",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="flex items-center gap-4 border-b border-border/60 py-5 last:border-0 sm:border-b-0 sm:border-r sm:px-8 sm:first:pl-0 sm:last:border-r-0"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                  <Icon className="size-4" />
                </span>
                <span>
                  <strong className="block text-sm font-medium">{title}</strong>
                  <span className="text-xs text-muted-foreground">{text}</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        <ProductShowcase />

        <section
          id="produtos"
          className="mx-auto w-full max-w-7xl scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28"
        >
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[0.65rem] uppercase tracking-luxe text-primary">Coleção</p>
            <h2 className="mt-4 font-display text-4xl font-medium sm:text-6xl">Nossa coleção</h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              Uma vitrine viva: tudo o que você vê aqui está disponível e é atualizado
              constantemente.
            </p>
          </div>

          <div className="mt-12 sm:mt-16">
            {isLoading ? (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded-3xl bg-card p-0 ring-1 ring-border/70">
                    <Skeleton className="aspect-4/5 w-full rounded-3xl" />
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

        <section id="sobre" className="scroll-mt-24 bg-night text-[#f8f3fa]">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-20 sm:px-8 sm:py-28 md:grid-cols-[0.9fr_1.1fr] md:items-center">
            <div>
              <p className="text-[0.65rem] uppercase tracking-luxe text-[#d8bff0]">
                Nossa essência
              </p>
              <h2 className="mt-5 font-display text-4xl font-medium sm:text-6xl">
                Escolhas com intenção e <span className="text-[#d8bff0]">delicadeza</span>
              </h2>
            </div>
            <div className="space-y-5 text-sm leading-7 text-[#b9adbf] sm:text-base">
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
