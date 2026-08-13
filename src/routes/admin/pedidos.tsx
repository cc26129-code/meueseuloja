import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Bell, LogOut, Package, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { orderNumber, paymentStatusLabel, type OrderItem, type PaymentStatus } from "@/lib/orders";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/admin/pedidos")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Pedidos e pagamentos | meueseuloja" },
      {
        name: "description",
        content: "Acompanhe os pedidos pagos, pendentes e as notificações da loja.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Pedidos e pagamentos | meueseuloja" },
      {
        property: "og:description",
        content: "Acompanhe os pedidos pagos, pendentes e as notificações da loja.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrdersPage,
});

const filters: { key: "all" | PaymentStatus; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "paid", label: "Pagos" },
  { key: "pending", label: "Pendentes" },
  { key: "expired", label: "Expirados" },
  { key: "cancelled", label: "Cancelados" },
  { key: "failed", label: "Falharam" },
];

function OrdersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | PaymentStatus>("all");
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate({ to: "/admin", replace: true });
      else setChecked(true);
    });
  }, [navigate]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    enabled: checked,
    refetchInterval: 15000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const { data: notifications } = useQuery({
    queryKey: ["admin-notifications"],
    enabled: checked,
    refetchInterval: 15000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const unread = (notifications ?? []).filter((n) => !n.read_at);

  async function markRead() {
    await supabase
      .from("admin_notifications")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null);
    await queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/admin", replace: true });
  }

  const list = (orders ?? []).filter((o) => filter === "all" || o.payment_status === filter);

  return (
    <div className="min-h-screen bg-night">
      <header className="border-b border-border bg-background">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-5 sm:px-8">
          <div className="min-w-0">
            <p className="truncate font-display text-2xl text-gold-gradient">meueseuloja</p>
            <p className="text-[0.6rem] uppercase tracking-luxe text-muted-foreground">
              pedidos e pagamentos
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="rounded-xl">
              <Link to="/admin/dashboard">
                <Package className="size-4 sm:mr-2" />
                <span className="hidden sm:inline">Produtos</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="rounded-xl">
              <Link to="/">
                <Store className="size-4 sm:mr-2" />
                <span className="hidden sm:inline">Ver loja</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={signOut}>
              <LogOut className="size-4 sm:mr-2" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-4xl">Pedidos</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              O estoque nunca é alterado automaticamente por um pagamento.
            </p>
          </div>
          {unread.length > 0 && (
            <Button variant="outline" size="sm" className="rounded-xl" onClick={markRead}>
              <Bell className="size-4 sm:mr-2" />
              <span className="hidden sm:inline">Marcar tudo como lido</span>
            </Button>
          )}
        </div>

        {unread.length > 0 && (
          <div className="mt-8 space-y-3">
            {unread.map((n) => (
              <div key={n.id} className="rounded-xl border border-primary/40 bg-primary/5 p-4">
                <p className="font-display text-xl">{n.title}</p>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-xs text-muted-foreground">
                  {n.body}
                </pre>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-2">
          {filters.map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={filter === f.key ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {isLoading ? (
            [0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
          ) : list.length === 0 ? (
            <div className="rounded-xl border border-border bg-card px-6 py-20 text-center">
              <p className="font-display text-2xl">Nenhum pedido por aqui</p>
            </div>
          ) : (
            list.map((order) => {
              const items = (order.items ?? []) as unknown as OrderItem[];
              return (
                <div key={order.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-2xl">Pedido {orderNumber(order.id)}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {order.customer_name} | {order.customer_contact}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleString("pt-BR")}
                        {order.paid_at
                          ? ` | pago em ${new Date(order.paid_at).toLocaleString("pt-BR")}`
                          : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`rounded-full px-3 py-1 text-[0.65rem] uppercase tracking-[0.16em] ${
                          order.payment_status === "paid"
                            ? "bg-primary/15 text-primary"
                            : order.payment_status === "pending"
                              ? "bg-accent text-accent-foreground"
                              : "bg-destructive/15 text-destructive"
                        }`}
                      >
                        {paymentStatusLabel[order.payment_status]}
                      </span>
                      <p className="mt-2 font-display text-2xl text-primary">
                        {formatBRL(Number(order.total_amount))}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
                    {items.map((item) => (
                      <div key={item.product_id} className="flex justify-between gap-3">
                        <span className="min-w-0 truncate">
                          {item.name} x {item.quantity}
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          {formatBRL(Number(item.subtotal))}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground">
                    Transação: {order.gateway_payment_id ?? "-"} | PIX
                  </p>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
