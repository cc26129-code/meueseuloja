import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/bootstrap-isab")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const pwd = new URL(request.url).searchParams.get("p");
        if (!pwd) return new Response("missing", { status: 400 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error) return new Response("err:" + error.message, { status: 400 });
        const u = data.users.find((x) => x.email === "isabsouza@meueseuloja.app");
        if (!u) return new Response("nouser", { status: 400 });
        const { error: uErr } = await supabaseAdmin.auth.admin.updateUserById(u.id, {
          password: pwd,
          email_confirm: true,
        });
        if (uErr) return new Response("uerr:" + uErr.message, { status: 400 });
        return new Response("ok");
      },
    },
  },
});
