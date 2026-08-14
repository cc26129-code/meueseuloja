import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import type { PublicOrder } from "./orders";

const checkoutSchema = z.object({
  customer_name: z.string().trim().min(2).max(80),
  customer_contact: z.string().trim().min(8).max(40),
  shipping_address: z.string().trim().min(5).max(500),
  postal_code: z.string().trim().min(8).max(9),
  shipping_quote_id: z.string().uuid(),
  shipping_service_id: z.string().trim().min(1).max(50),
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
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => checkoutSchema.parse(data))
  .handler(async ({ data, context }): Promise<PublicOrder> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { createPixPayment } = await import("./mercadopago.server");
    const { buildOrderItems, fromCents, resolveSiteOrigin, toCents } =
      await import("./checkout.server");
    const { calculateShipping, normalizePostalCode } = await import("./shipping.server");

    const { data: customer } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", context.userId)
      .single();
    if (!customer) throw new Error("Conta de usuário não encontrada.");

    const postalCode = normalizePostalCode(data.postal_code);
    const { data: storedQuote } = await supabaseAdmin
      .from("shipping_quotes")
      .select("id, destination_postal_code, cart_fingerprint, options, created_at, expires_at")
      .eq("id", data.shipping_quote_id)
      .eq("user_id", context.userId)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (!storedQuote || storedQuote.destination_postal_code !== postalCode) {
      throw new Error("A cotação expirou. Calcule o frete novamente.");
    }

    const previousOptions = Array.isArray(storedQuote.options)
      ? (storedQuote.options as Array<Record<string, unknown>>)
      : [];
    const previousOption = previousOptions.find(
      (option) => String(option["service_id"]) === data.shipping_service_id,
    );
    if (!previousOption) throw new Error("A opção de frete selecionada não é válida.");

    // Critical security check: products and shipping are fetched again immediately before PIX.
    const freshQuote = await calculateShipping(data.items, postalCode);
    if (freshQuote.cart.fingerprint !== storedQuote.cart_fingerprint) {
      throw new Error("O carrinho ou os produtos mudaram. Calcule o frete novamente.");
    }
    const selectedShipping = freshQuote.options.find(
      (option) => option.service_id === data.shipping_service_id,
    );
    if (!selectedShipping) {
      throw new Error("O frete escolhido não está mais disponível. Calcule novamente.");
    }
    if (toCents(selectedShipping.price) !== toCents(Number(previousOption["price"]))) {
      throw new Error("O valor do frete mudou. Calcule novamente antes de gerar o PIX.");
    }

    const { items, subtotal, subtotalCents } = buildOrderItems(
      data.items,
      freshQuote.cart.products,
    );
    const shippingCents = toCents(selectedShipping.price);
    const total = fromCents(subtotalCents + shippingCents);

    const origin = resolveSiteOrigin(getRequest().url);

    const { data: order, error: insertError } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_name: data.customer_name,
        customer_contact: data.customer_contact,
        customer_email: customer.email,
        shipping_address: data.shipping_address.trim(),
        delivery_address: {
          address: data.shipping_address.trim(),
          postal_code: postalCode,
        } as never,
        delivery_postal_code: postalCode,
        user_id: context.userId,
        items: items as never,
        subtotal,
        shipping_amount: selectedShipping.price,
        shipping_carrier: selectedShipping.carrier,
        shipping_service: selectedShipping.service,
        shipping_service_id: selectedShipping.service_id,
        shipping_deadline: selectedShipping.delivery_days,
        shipping_quote_id: storedQuote.id,
        shipping_quoted_at: storedQuote.created_at,
        total_amount: total,
        payment_method: "pix",
        payment_status: "pending",
      })
      .select("*")
      .single();
    if (insertError || !order) throw new Error("Não foi possível criar o pedido.");

    const { error: itemError } = await supabaseAdmin.from("order_items").insert(
      items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.name,
        unit_price: item.unit_price,
        quantity: item.quantity,
        subtotal: item.subtotal,
      })),
    );
    if (itemError) throw new Error("Não foi possível registrar os itens do pedido.");

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const payment = await createPixPayment({
      amount: total,
      description: `Pedido ${order.id.slice(0, 8).toUpperCase()} meueseuloja`,
      externalReference: order.id,
      idempotencyKey: order.id,
      notificationUrl: `${origin}/api/public/webhooks/mercadopago`,
      payerEmail: customer.email,
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
    await supabaseAdmin.from("payments").insert({
      order_id: order.id,
      provider: "mercadopago",
      provider_payment_id: String(payment.id),
      method: "pix",
      status: "pending",
      amount: total,
    });
    await supabaseAdmin.from("cart_items").delete().eq("user_id", context.userId);
    return {
      id: row.id,
      total_amount: Number(row.total_amount),
      subtotal: Number(row.subtotal),
      shipping_amount: Number(row.shipping_amount),
      shipping_carrier: row.shipping_carrier,
      shipping_service: row.shipping_service,
      shipping_deadline: row.shipping_deadline,
      delivery_postal_code: row.delivery_postal_code,
      delivery_address: row.shipping_address,
      tracking_code: row.tracking_code,
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
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<PublicOrder | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", context.userId)
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
          .eq("user_id", context.userId)
          .maybeSingle();
        if (refreshed) Object.assign(order, refreshed);
      }
    }

    return {
      id: order.id,
      total_amount: Number(order.total_amount),
      subtotal: Number(order.subtotal),
      shipping_amount: Number(order.shipping_amount),
      shipping_carrier: order.shipping_carrier,
      shipping_service: order.shipping_service,
      shipping_deadline: order.shipping_deadline,
      delivery_postal_code: order.delivery_postal_code,
      delivery_address: order.shipping_address,
      tracking_code: order.tracking_code,
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
