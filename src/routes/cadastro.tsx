import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/providers/auth-provider";

const schema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/),
  address: z.string().trim().max(500),
});

export const Route = createFileRoute("/cadastro")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { next?: string } => {
    const next = search["next"];
    return typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
      ? { next }
      : {};
  },
  head: () => ({
    meta: [{ title: "Criar conta | meueseuloja" }, { name: "robots", content: "noindex" }],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const { user, loading: authLoading, signUp } = useAuth();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", address: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) void navigate({ to: next ?? "/conta", replace: true });
  }, [authLoading, navigate, next, user]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const result = schema.safeParse(form);
    if (!result.success) {
      toast.error("Revise os dados. A senha deve ter 8 caracteres, maiúscula, minúscula e número.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await signUp(result.data);
      if (response.needsEmailConfirmation) {
        toast.success("Conta criada. Confirme o e-mail antes de entrar.");
        await navigate({ to: "/entrar", search: next ? { next } : {} });
      } else {
        toast.success("Conta criada com sucesso.");
        await navigate({ to: next ?? "/conta", replace: true });
      }
    } catch (error) {
      const message =
        error instanceof Error && /already|registered|unique/i.test(error.message)
          ? "Este e-mail já está cadastrado."
          : "Não foi possível criar a conta. Verifique os dados e tente novamente.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  const field = (name: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [name]: value }));

  return (
    <div className="grid min-h-screen place-items-center bg-night px-5 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-luxe sm:p-12">
        <Link to="/" className="block text-center font-display text-3xl text-gold-gradient">
          meueseuloja
        </Link>
        <div className="mt-8 flex items-center justify-center gap-2 text-[0.65rem] uppercase tracking-luxe text-muted-foreground">
          <UserPlus className="size-3.5" /> Nova conta
        </div>
        <h1 className="mt-5 text-center font-display text-4xl">Criar conta</h1>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome completo</Label>
            <Input
              id="fullName"
              autoComplete="name"
              value={form.fullName}
              onChange={(e) => field("fullName")(e.target.value)}
              maxLength={100}
              className="rounded-xl"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => field("email")(e.target.value)}
              maxLength={254}
              className="rounded-xl"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => field("password")(e.target.value)}
              maxLength={128}
              className="rounded-xl"
              required
            />
            <p className="text-xs text-muted-foreground">
              Use pelo menos 8 caracteres, com maiúscula, minúscula e número.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Endereço (opcional)</Label>
            <Textarea
              id="address"
              autoComplete="street-address"
              value={form.address}
              onChange={(e) => field("address")(e.target.value)}
              maxLength={500}
              className="min-h-20 rounded-xl"
            />
          </div>
          <Button
            type="submit"
            className="w-full rounded-full"
            disabled={submitting || authLoading}
          >
            {submitting && <Loader2 className="mr-2 size-4 animate-spin" />} Criar conta
          </Button>
        </form>
        <p className="mt-7 text-center text-sm text-muted-foreground">
          Já possui uma conta?{" "}
          <Link to="/entrar" search={next ? { next } : {}} className="text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
