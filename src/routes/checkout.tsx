import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, QrCode, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/providers/cart-provider";
import { createPixOrder } from "@/lib/checkout.functions";
import { useCartLines } from "@/hooks/use-cart-lines";
import { formatBRL } from "@/lib/format";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/providers/auth-provider";

export const Route = createFileRoute("/checkout")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Finalizar pedido com PIX | meueseuloja" },
      {
        name: "description",
        content: "Confirme seus dados e pague com PIX de forma rápida e segura na meueseuloja.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Finalizar pedido com PIX | meueseuloja" },
      {
        property: "og:description",
        content: "Confirme seus dados e pague com PIX de forma rápida e segura na meueseuloja.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { items, clear } = useCart();
  const createOrder = useServerFn(createPixOrder);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const { lines, total } = useCartLines();

  useEffect(() => {
    if (!authLoading && !user)
      void navigate({ to: "/entrar", search: { next: "/checkout" }, replace: true });
  }, [authLoading, navigate, user]);

  useEffect(() => {
    if (!profile) return;
    setName((current) => current || profile.full_name);
    setAddress((current) => current || profile.address);
  }, [profile]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Informe seu nome completo.");
      return;
    }
    const digits = contact.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 13) {
      toast.error("Informe um WhatsApp válido com DDD.");
      return;
    }
    if (lines.length === 0) {
      toast.error("Seu carrinho está vazio.");
      return;
    }

    setLoading(true);
    try {
      const order = await createOrder({
        data: {
          customer_name: name.trim(),
          customer_contact: contact.trim(),
          shipping_address: address.trim() || undefined,
          items: lines.map((l) => ({ id: l.product.id, qty: l.item.qty })),
        },
      });
      clear();
      navigate({ to: "/pedido/$id", params: { id: order.id } });
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "Não foi possível iniciar o pagamento. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-night px-5 py-12 sm:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-3.5" /> Voltar à loja
        </Link>

        <h1 className="mt-8 font-display text-4xl sm:text-5xl">Finalizar pedido</h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Pagamento via PIX. O valor é calculado e conferido pelo nosso servidor no momento da
          cobrança.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <form
            onSubmit={submit}
            className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8"
          >
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs uppercase tracking-widest">
                Nome completo
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                autoComplete="name"
                className="rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-xs uppercase tracking-widest">
                Endereço para entrega
              </Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                maxLength={500}
                autoComplete="street-address"
                placeholder="Opcional; confirme se o pedido precisar de entrega"
                className="min-h-24 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact" className="text-xs uppercase tracking-widest">
                WhatsApp com DDD
              </Label>
              <Input
                id="contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="(11) 99999-9999"
                maxLength={40}
                inputMode="tel"
                autoComplete="tel"
                className="rounded-xl"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading || authLoading || !user || lines.length === 0}
              className="w-full rounded-full tracking-widest"
            >
              {loading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <QrCode className="mr-2 size-4" />
              )}
              Gerar PIX
            </Button>

            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
              Seus dados são usados apenas para identificar o pedido. O pagamento é confirmado
              automaticamente pelo banco.
            </p>
          </form>

          <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-soft">
            <p className="text-xs uppercase tracking-luxe text-muted-foreground">Resumo</p>
            <div className="mt-4 space-y-3">
              {lines.length === 0 ? (
                <p className="text-sm text-muted-foreground">Seu carrinho está vazio.</p>
              ) : (
                lines.map(({ item, product }) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate">{product.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.qty} x {formatBRL(Number(product.price))}
                      </span>
                    </span>
                    <span className="shrink-0 text-primary">
                      {formatBRL(Number(product.price) * item.qty)}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <span className="text-xs uppercase tracking-luxe text-muted-foreground">Total</span>
              <span className="font-display text-3xl text-primary">{formatBRL(total)}</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
