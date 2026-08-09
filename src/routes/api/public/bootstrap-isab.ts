import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/bootstrap-isab")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const email = "isabsouza@meueseuloja.app";
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: process.env["BOOTSTRAP_PWD"]!,
          email_confirm: true,
        });
        if (error) return new Response("err:" + error.message, { status: 400 });
        const { error: rErr } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: data.user!.id, role: "admin" });
        if (rErr) return new Response("roleerr:" + rErr.message, { status: 400 });
        return new Response("ok");
      },
    },
  },
});
