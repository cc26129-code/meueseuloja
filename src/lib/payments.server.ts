import { getPayment, mapPaymentStatus } from "./mercadopago.server";
import { buildPaidOrderNotification, sendAdminEmail, type PaidOrder } from "./notifications.server";
import type { OrderItem } from "./orders";

type SettleResult = { handled: boolean; status?: string; reason?: string };

/**
 * Reads the real payment status from Mercado Pago and applies it to the order.
 * Idempotent: the same gateway event is only processed once.
 */
export async function settlePaymentFromGateway(
  paymentId: string,
  payload?: unknown,
): Promise<SettleResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const payment = await getPayment(paymentId);
  if (!payment) return { handled: false, reason: "payment_not_found" };

  const mapped = mapPaymentStatus(payment.status, payment.status_detail);
  if (!mapped) return { handled: false, reason: "unmapped_status" };

  const { error: eventError } = await supabaseAdmin.from("payment_webhook_events").insert({
    provider: "mercadopago",
    event_key: `payment:${payment.id}:${payment.status}`,
    payload: (payload ?? null) as never,
  });
  // Unique violation (23505) means this exact event was already delivered.
  // We still continue: every write below is conditional on the order being
  // pending, so duplicates can never produce a second paid order.
  if (eventError && eventError.code !== "23505") {
    console.error("[payments] failed to record webhook event", eventError);
  }

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("gateway_payment_id", String(payment.id))
    .maybeSingle();

  if (!order) return { handled: false, reason: "order_not_found" };
  if (order.payment_status === "paid") return { handled: false, reason: "already_paid" };

  if (mapped === "paid") {
    const paidAmount = Number(payment.transaction_amount ?? 0);
    const expected = Number(order.total_amount);
    if (Math.abs(paidAmount - expected) > 0.009) {
      console.error("[payments] amount mismatch", { paidAmount, expected, orderId: order.id });
      return { handled: false, reason: "amount_mismatch" };
    }

    const paidAt = new Date().toISOString();
    const { data: updated } = await supabaseAdmin
      .from("orders")
      .update({ payment_status: "paid", order_status: "payment_approved", paid_at: paidAt })
      .eq("id", order.id)
      .eq("payment_status", "pending")
      .select("id")
      .maybeSingle();

    // Another concurrent delivery already flipped it: do not notify twice.
    if (!updated) return { handled: false, reason: "already_paid" };

    await supabaseAdmin
      .from("payments")
      .update({ status: "paid", paid_at: paidAt })
      .eq("provider", "mercadopago")
      .eq("provider_payment_id", String(payment.id));

    const paidOrder: PaidOrder = {
      id: order.id,
      customer_name: order.customer_name,
      customer_contact: order.customer_contact,
      items: (order.items ?? []) as unknown as OrderItem[],
      total_amount: Number(order.total_amount),
      payment_method: order.payment_method,
      gateway_payment_id: order.gateway_payment_id,
      paid_at: paidAt,
    };
    const notification = buildPaidOrderNotification(paidOrder);

    await supabaseAdmin.from("admin_notifications").insert({
      order_id: order.id,
      title: notification.title,
      body: notification.body,
    });
    await sendAdminEmail(notification.title, notification.body);

    return { handled: true, status: "paid" };
  }

  if (mapped !== "pending") {
    const orderUpdate =
      mapped === "cancelled" || mapped === "expired"
        ? { payment_status: mapped, order_status: "cancelled" as const }
        : { payment_status: mapped };
    await supabaseAdmin
      .from("orders")
      .update(orderUpdate)
      .eq("id", order.id)
      .eq("payment_status", "pending");
    await supabaseAdmin
      .from("payments")
      .update({ status: mapped })
      .eq("provider", "mercadopago")
      .eq("provider_payment_id", String(payment.id));
    return { handled: true, status: mapped };
  }

  return { handled: false, status: "pending" };
}
