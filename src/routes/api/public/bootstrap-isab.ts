import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/bootstrap-isab")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error) return new Response("err:" + error.message, { status: 400 });
        const old = data.users.find((u) => u.email === "luciasouza@meueseuloja.app");
        if (!old) return new Response("none");
        await supabaseAdmin.from("user_roles").delete().eq("user_id", old.id);
        const { error: dErr } = await supabaseAdmin.auth.admin.deleteUser(old.id);
        if (dErr) return new Response("delerr:" + dErr.message, { status: 400 });
        return new Response("deleted");
      },
    },
  },
});
