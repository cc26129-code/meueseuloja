import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const statusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum([
    "awaiting_payment",
    "payment_approved",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ]),
});

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => statusSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: adminRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRow) throw new Error("Acesso não autorizado.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ order_status: data.status })
      .eq("id", data.orderId);
    if (error) throw new Error("Não foi possível atualizar o pedido.");
    return { ok: true };
  });

const trackingSchema = z.object({
  orderId: z.string().uuid(),
  trackingCode: z.string().trim().max(100),
});

export const updateTrackingCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => trackingSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: adminRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRow) throw new Error("Acesso não autorizado.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ tracking_code: data.trackingCode || null })
      .eq("id", data.orderId);
    if (error) throw new Error("Não foi possível atualizar o código de rastreio.");
    return { ok: true };
  });
