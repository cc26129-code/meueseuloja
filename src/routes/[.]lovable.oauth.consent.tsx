import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type OAuthApi = {
  getAuthorizationDetails: (
    id: string,
  ) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (
    id: string,
  ) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  denyAuthorization: (
    id: string,
  ) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
};

type AuthorizationDetails = {
  client?: { name?: string } | null;
  redirect_url?: string | null;
  redirect_to?: string | null;
};

function oauthApi(): OAuthApi {
  return (supabase.auth as unknown as { oauth: OAuthApi }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s["authorization_id"] === "string" ? s["authorization_id"] : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/admin", search: { next: location.pathname + location.searchStr } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="grid min-h-screen place-items-center bg-night px-5 text-center">
      <p className="max-w-md text-sm text-muted-foreground">
        Não foi possível carregar esta autorização: {String((error as Error)?.message ?? error)}
      </p>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientName = details?.client?.name ?? "este aplicativo";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const api = oauthApi();
    const { data, error: decisionError } = approve
      ? await api.approveAuthorization(authorization_id)
      : await api.denyAuthorization(authorization_id);
    if (decisionError) {
      setBusy(false);
      setError(decisionError.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("O servidor de autorização não retornou um destino de redirecionamento.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="grid min-h-screen place-items-center bg-night px-5 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-luxe sm:p-10">
        <div className="flex items-center justify-center gap-2 text-[0.65rem] uppercase tracking-luxe text-muted-foreground">
          <Lock className="size-3" /> Autorização
        </div>
        <h1 className="mt-6 text-center font-display text-3xl">Conectar {clientName}</h1>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Ao permitir, {clientName} poderá usar as ferramentas da meueseuloja em seu nome, com as
          mesmas permissões da sua conta.
        </p>

        {error && (
          <p role="alert" className="mt-5 text-center text-xs text-destructive">
            {error}
          </p>
        )}

        <div className="mt-8 grid gap-3">
          <Button disabled={busy} className="rounded-full" onClick={() => decide(true)}>
            {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
            Permitir
          </Button>
          <Button
            disabled={busy}
            variant="outline"
            className="rounded-full"
            onClick={() => decide(false)}
          >
            Recusar
          </Button>
        </div>
      </div>
    </main>
  );
}
