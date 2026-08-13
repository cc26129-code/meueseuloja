import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/providers/auth-provider";

const schema = z.object({ email: z.string().trim().email(), password: z.string().min(6).max(128) });

export const Route = createFileRoute("/entrar")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { next?: string } => {
    const next = search["next"];
    return typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
      ? { next }
      : {};
  },
  head: () => ({
    meta: [{ title: "Entrar | meueseuloja" }, { name: "robots", content: "noindex" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const { user, loading: authLoading, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) void navigate({ to: next ?? "/conta", replace: true });
  }, [authLoading, navigate, next, user]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const result = schema.safeParse({ email, password });
    if (!result.success) {
      toast.error("Informe um e-mail e uma senha válidos.");
      return;
    }
    setSubmitting(true);
    try {
      await signIn(result.data.email, result.data.password);
      toast.success("Login realizado com sucesso.");
      await navigate({ to: next ?? "/conta", replace: true });
    } catch {
      toast.error("E-mail ou senha inválidos, ou o e-mail ainda não foi confirmado.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-night px-5 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-luxe sm:p-12">
        <Link to="/" className="block text-center font-display text-3xl text-gold-gradient">
          meueseuloja
        </Link>
        <div className="mt-8 flex items-center justify-center gap-2 text-[0.65rem] uppercase tracking-luxe text-muted-foreground">
          <LockKeyhole className="size-3.5" /> Acesso à conta
        </div>
        <h1 className="mt-5 text-center font-display text-4xl">Entrar</h1>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={128}
              className="rounded-xl"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full rounded-full"
            disabled={submitting || authLoading}
          >
            {submitting && <Loader2 className="mr-2 size-4 animate-spin" />} Entrar
          </Button>
        </form>
        <p className="mt-7 text-center text-sm text-muted-foreground">
          Ainda não possui conta?{" "}
          <Link
            to="/cadastro"
            search={next ? { next } : {}}
            className="text-primary hover:underline"
          >
            Criar conta
          </Link>
        </p>
        <Link
          to="/"
          className="mt-5 block text-center text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
        >
          Voltar à loja
        </Link>
      </div>
    </div>
  );
}
