import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { usernameToEmail } from "@/lib/auth";
import { isAdmin } from "@/services/roles";

export const Route = createFileRoute("/admin/")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { next?: string } => {
    const next = s["next"];
    return typeof next === "string" && next.startsWith("/") ? { next } : {};
  },
  head: () => ({
    meta: [
      { title: "Acesso restrito | meueseuloja" },
      { name: "description", content: "Área administrativa da meueseuloja." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Acesso restrito | meueseuloja" },
      { property: "og:description", content: "Área administrativa da meueseuloja." },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const admin = await isAdmin(data.session.user.id);
      if (!admin) return;
      if (next) window.location.replace(next);
      else navigate({ to: "/admin/dashboard", replace: true });
    });
  }, [navigate, next]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (username.trim().length < 3 || password.length < 6) {
      toast.error("Informe usuário e senha válidos.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });
    setLoading(false);
    if (error) {
      toast.error("Usuário ou senha inválidos.");
      return;
    }
    toast.success("Bem-vinda de volta!");
    if (next) {
      window.location.replace(next);
      return;
    }
    navigate({ to: "/admin/dashboard", replace: true });
  }

  return (
    <div className="grid min-h-screen place-items-center bg-night px-5 py-16">
      <div className="w-full max-w-md border border-border bg-card p-8 shadow-luxe sm:p-12">
        <Link to="/" className="block text-center">
          <span className="font-display text-3xl text-gold-gradient">meueseuloja</span>
        </Link>
        <div className="mt-8 flex items-center justify-center gap-2 text-[0.65rem] uppercase tracking-luxe text-muted-foreground">
          <Lock className="size-3" /> Acesso restrito
        </div>

        <form onSubmit={onSubmit} className="mt-10 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-xs uppercase tracking-widest">
              Usuário
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              maxLength={60}
              className="rounded-xl"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs uppercase tracking-widest">
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              maxLength={128}
              className="rounded-xl"
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full rounded-xl tracking-widest">
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Entrar
          </Button>
        </form>

        <Link
          to="/"
          className="mt-8 block text-center text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
        >
          Voltar à loja
        </Link>
      </div>
    </div>
  );
}
