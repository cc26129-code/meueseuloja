import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock, Copy, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getPublicOrder } from "@/lib/checkout.functions";
import { orderNumber, paymentStatusLabel } from "@/lib/orders";
import { formatBRL } from "@/lib/format";
import { useAuth } from "@/providers/auth-provider";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/pedido/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Pagamento PIX do pedido | meueseuloja" },
      {
        name: "description",
        content: "Escaneie o QR Code PIX e acompanhe a confirmação do pagamento em tempo real.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Pagamento PIX do pedido | meueseuloja" },
      {
        property: "og:description",
        content: "Escaneie o QR Code PIX e acompanhe a confirmação do pagamento em tempo real.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderPage,
});

function useCountdown(expiresAt: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - now;
  if (diff <= 0) return "expirado";
  const m = Math.floor(diff / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function OrderPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { id } = Route.useParams();
  const fetchOrder = useServerFn(getPublicOrder);

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => fetchOrder({ data: { id } }),
    enabled: Boolean(user),
    refetchInterval: (query) => (query.state.data?.payment_status === "pending" ? 5000 : false),
  });

  useEffect(() => {
    if (!authLoading && !user)
      void navigate({ to: "/entrar", search: { next: `/pedido/${id}` }, replace: true });
  }, [authLoading, id, navigate, user]);

  const countdown = useCountdown(order?.expires_at ?? null);

  function copyCode() {
    if (!order?.qr_code) return;
    void navigator.clipboard.writeText(order.qr_code).then(
      () => toast.success("Código PIX copiado."),
      () => toast.error("Não foi possível copiar o código."),
    );
  }

  return (
    <div className="min-h-screen bg-night px-5 py-12 sm:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-3.5" /> Voltar à loja
        </Link>

        {isLoading ? (
          <Skeleton className="mt-10 h-96 w-full rounded-2xl" />
        ) : !order ? (
          <div className="mt-10 rounded-2xl border border-border bg-card p-10 text-center">
            <p className="font-display text-3xl">Pedido não encontrado</p>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-10">
            <p className="text-xs uppercase tracking-luxe text-muted-foreground">
              Pedido {orderNumber(order.id)}
            </p>

            {order.payment_status === "paid" ? (
              <div className="mt-6 grid place-items-center gap-4 py-10 text-center">
                <CheckCircle2 className="size-12 text-primary" />
                <h1 className="font-display text-4xl">Pagamento confirmado</h1>
                <p className="max-w-md text-sm text-muted-foreground">
                  Recebemos o seu PIX. A loja já foi notificada e entrará em contato pelo WhatsApp
                  para combinar a entrega.
                </p>
                <Button asChild className="mt-2 rounded-full">
                  <Link to="/">Voltar à loja</Link>
                </Button>
              </div>
            ) : order.payment_status === "pending" ? (
              <div className="mt-6 grid gap-8 sm:grid-cols-[16rem_minmax(0,1fr)] sm:items-start">
                <div className="rounded-2xl border border-border bg-background p-4">
                  {order.qr_code_base64 ? (
                    <img
                      src={`data:image/png;base64,${order.qr_code_base64}`}
                      alt="QR Code PIX do pedido"
                      className="size-full rounded-lg"
                    />
                  ) : (
                    <p className="p-6 text-center text-sm text-muted-foreground">
                      QR Code indisponível. Use o código copia e cola.
                    </p>
                  )}
                </div>
                <div>
                  <h1 className="font-display text-4xl">Pague com PIX</h1>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Escaneie o QR Code no app do seu banco ou use o código copia e cola. A
                    confirmação é automática.
                  </p>

                  <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="size-4 text-primary" />
                    {countdown === "expirado"
                      ? "Cobrança expirada."
                      : `Expira em ${countdown ?? "--"}`}
                  </div>

                  {order.qr_code && (
                    <div className="mt-5 space-y-3">
                      <p className="break-all rounded-xl border border-border bg-background/60 p-3 text-[0.7rem] text-muted-foreground">
                        {order.qr_code}
                      </p>
                      <Button onClick={copyCode} className="w-full rounded-full">
                        <Copy className="mr-2 size-4" /> Copiar código PIX
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-6 grid place-items-center gap-4 py-10 text-center">
                <XCircle className="size-12 text-destructive" />
                <h1 className="font-display text-4xl">
                  {paymentStatusLabel[order.payment_status]}
                </h1>
                <p className="max-w-md text-sm text-muted-foreground">
                  Este pagamento não foi concluído. Você pode montar o carrinho novamente e gerar um
                  novo PIX.
                </p>
                <Button asChild className="mt-2 rounded-full">
                  <Link to="/">Voltar à loja</Link>
                </Button>
              </div>
            )}

            <div className="mt-10 border-t border-border pt-6">
              <p className="text-xs uppercase tracking-luxe text-muted-foreground">Itens</p>
              <div className="mt-4 space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.product_id}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{item.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.quantity} x {formatBRL(Number(item.unit_price))}
                      </span>
                    </span>
                    <span className="shrink-0 text-primary">
                      {formatBRL(Number(item.subtotal))}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <span className="text-xs uppercase tracking-luxe text-muted-foreground">Total</span>
                <span className="font-display text-3xl text-primary">
                  {formatBRL(Number(order.total_amount))}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
