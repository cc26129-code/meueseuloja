import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import type { PublicOrder } from "./orders";

const checkoutSchema = z.object({
  customer_name: z.string().trim().min(2).max(80),
  customer_contact: z.string().trim().min(8).max(40),
  items: z
    .array(
      z.object({
        id: z.string().uuid(),
        qty: z.number().int().min(1).max(99),
      }),
    )
    .min(1)
    .max(30),
});

export const createPixOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => checkoutSchema.parse(data))
  .handler(async ({ data }): Promise<PublicOrder> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { createPixPayment } = await import("./mercadopago.server");
    const { buildOrderItems, resolveSiteOrigin } = await import("./checkout.server");

    const ids = [...new Set(data.items.map((i) => i.id))];
    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("id, name, price, stock_quantity")
      .in("id", ids);
    if (error) throw new Error("Não foi possível validar os produtos.");

    // Prices, subtotals and total are recalculated here from the database.
    const { items, total } = buildOrderItems(data.items, products ?? []);

    const origin = resolveSiteOrigin(getRequest().url);

    const { data: order, error: insertError } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_name: data.customer_name,
        customer_contact: data.customer_contact,
        items: items as never,
        total_amount: total,
        payment_method: "pix",
        payment_status: "pending",
      })
      .select("*")
      .single();
    if (insertError || !order) throw new Error("Não foi possível criar o pedido.");

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const payment = await createPixPayment({
      amount: total,
      description: `Pedido ${order.id.slice(0, 8).toUpperCase()} meueseuloja`,
      externalReference: order.id,
      idempotencyKey: order.id,
      notificationUrl: `${origin}/api/public/webhooks/mercadopago`,
      payerEmail: `pedido.${order.id.slice(0, 8)}@meueseuloja.app`,
      payerFirstName: data.customer_name.split(" ")[0] ?? "Cliente",
      expiresAt,
    });

    const qr = payment.point_of_interaction?.transaction_data;
    const { data: updated } = await supabaseAdmin
      .from("orders")
      .update({
        gateway_payment_id: String(payment.id),
        gateway_qr_code: qr?.qr_code ?? null,
        gateway_qr_code_base64: qr?.qr_code_base64 ?? null,
        expires_at: payment.date_of_expiration ?? expiresAt.toISOString(),
      })
      .eq("id", order.id)
      .select("*")
      .single();

    const row = updated ?? order;
    return {
      id: row.id,
      total_amount: Number(row.total_amount),
      payment_status: row.payment_status,
      payment_method: row.payment_method,
      items,
      qr_code: row.gateway_qr_code,
      qr_code_base64: row.gateway_qr_code_base64,
      expires_at: row.expires_at,
      created_at: row.created_at,
      paid_at: row.paid_at,
    };
  });

export const getPublicOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }): Promise<PublicOrder | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!order) return null;

    // Reconciliation: the status always comes from the gateway, never from the client.
    if (order.payment_status === "pending" && order.gateway_payment_id) {
      const { settlePaymentFromGateway } = await import("./payments.server");
      const result = await settlePaymentFromGateway(order.gateway_payment_id);
      if (result.handled) {
        const { data: refreshed } = await supabaseAdmin
          .from("orders")
          .select("*")
          .eq("id", data.id)
          .maybeSingle();
        if (refreshed) Object.assign(order, refreshed);
      }
    }

    return {
      id: order.id,
      total_amount: Number(order.total_amount),
      payment_status: order.payment_status,
      payment_method: order.payment_method,
      items: (order.items ?? []) as never,
      qr_code: order.gateway_qr_code,
      qr_code_base64: order.gateway_qr_code_base64,
      expires_at: order.expires_at,
      created_at: order.created_at,
      paid_at: order.paid_at,
    };
  });
