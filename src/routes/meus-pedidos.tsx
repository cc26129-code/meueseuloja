import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Clock3, PackageOpen } from "lucide-react";
import { useEffect } from "react";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/format";
import { orderNumber, paymentStatusLabel, type OrderItem } from "@/lib/orders";
import { useAuth } from "@/providers/auth-provider";
import { orderStatusLabel } from "@/types/account";

export const Route = createFileRoute("/meus-pedidos")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Meus pedidos | meueseuloja" }, { name: "robots", content: "noindex" }],
  }),
  component: MyOrdersPage,
});

function MyOrdersPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  useEffect(() => {
    if (!loading && !user)
      void navigate({ to: "/entrar", search: { next: "/meus-pedidos" }, replace: true });
  }, [loading, navigate, user]);

  const query = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: Boolean(user),
    refetchInterval: 15000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto w-full max-w-5xl px-5 pb-24 pt-36 sm:px-8 sm:pt-44">
        <p className="text-[0.65rem] uppercase tracking-luxe text-primary">Área do cliente</p>
        <h1 className="mt-5 font-display text-4xl sm:text-5xl">Meus pedidos</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Acompanhe pagamentos e o andamento das suas compras.
        </p>
        <div className="mt-10 space-y-5">
          {loading || query.isLoading ? (
            [0, 1].map((item) => <Skeleton key={item} className="h-52 rounded-2xl" />)
          ) : query.isError ? (
            <div className="rounded-2xl border border-destructive/40 bg-card p-10 text-center text-sm text-muted-foreground">
              Não foi possível carregar seus pedidos agora.
            </div>
          ) : (query.data ?? []).length === 0 ? (
            <div className="rounded-2xl border border-border bg-card px-8 py-20 text-center">
              <PackageOpen className="mx-auto size-9 text-primary" />
              <p className="mt-5 font-display text-3xl">Nenhum pedido ainda</p>
              <p className="mt-3 text-sm text-muted-foreground">
                Quando você realizar uma compra, ela aparecerá aqui.
              </p>
              <Button asChild className="mt-7 rounded-full">
                <Link to="/">Explorar produtos</Link>
              </Button>
            </div>
          ) : (
            (query.data ?? []).map((order) => {
              const items = (order.items ?? []) as unknown as OrderItem[];
              return (
                <article
                  key={order.id}
                  className="rounded-2xl border border-border bg-card p-6 shadow-soft"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-luxe text-muted-foreground">
                        Pedido {orderNumber(order.id)}
                      </p>
                      <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock3 className="size-4 text-primary" />{" "}
                        {new Date(order.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-2xl text-primary">
                        {formatBRL(Number(order.total_amount))}
                      </p>
                      <div className="mt-2 flex flex-wrap justify-end gap-2">
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                          {paymentStatusLabel[order.payment_status]}
                        </span>
                        <span className="rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground">
                          {orderStatusLabel[order.order_status]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 space-y-2 border-t border-border pt-4">
                    {items.map((item) => (
                      <div
                        key={`${item.product_id}-${item.name}`}
                        className="flex justify-between gap-3 text-sm"
                      >
                        <span className="truncate">
                          {item.name} × {item.quantity}
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          {formatBRL(Number(item.subtotal))}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>Pagamento: {order.payment_method.toUpperCase()}</span>
                    {order.payment_status === "pending" && (
                      <Button asChild size="sm" className="rounded-full">
                        <Link to="/pedido/$id" params={{ id: order.id }}>
                          Pagar agora
                        </Link>
                      </Button>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
