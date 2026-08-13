import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ShippingQuote } from "./shipping.types";

const quoteSchema = z.object({
  postal_code: z.string().trim().min(8).max(9),
  items: z
    .array(z.object({ id: z.string().uuid(), qty: z.number().int().min(1).max(99) }))
    .min(1)
    .max(30),
});

export const quoteShipping = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => quoteSchema.parse(data))
  .handler(async ({ data, context }): Promise<ShippingQuote> => {
    const { calculateShipping } = await import("./shipping.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result = await calculateShipping(data.items, data.postal_code);
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString();
    const { data: quote, error } = await supabaseAdmin
      .from("shipping_quotes")
      .insert({
        user_id: context.userId,
        destination_postal_code: result.postalCode,
        cart_fingerprint: result.cart.fingerprint,
        options: result.options as never,
        expires_at: expiresAt,
      })
      .select("id, destination_postal_code, expires_at")
      .single();
    if (error || !quote) throw new Error("Não foi possível registrar a cotação de frete.");

    return {
      id: quote.id,
      postal_code: quote.destination_postal_code,
      expires_at: quote.expires_at,
      options: result.options,
    };
  });
