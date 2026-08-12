import type { OrderItem } from "./orders";
import { orderNumber } from "./orders";

function brl(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export type PaidOrder = {
  id: string;
  customer_name: string;
  customer_contact: string;
  items: OrderItem[];
  total_amount: number;
  payment_method: string;
  gateway_payment_id: string | null;
  paid_at: string | null;
};

export function buildPaidOrderNotification(order: PaidOrder) {
  const paidAt = order.paid_at ? new Date(order.paid_at) : new Date();
  const lines = order.items.map(
    (i) =>
      `${i.name} x ${i.quantity}\n${brl(Number(i.unit_price))} cada\nSubtotal: ${brl(Number(i.subtotal))}`,
  );

  const body = [
    `Pedido: ${orderNumber(order.id)}`,
    `Cliente: ${order.customer_name}`,
    `Contato: ${order.customer_contact}`,
    "",
    ...lines,
    "",
    `Total: ${brl(Number(order.total_amount))}`,
    `Pagamento: ${order.payment_method.toUpperCase()}`,
    "Status: Pago",
    `ID da transacao: ${order.gateway_payment_id ?? "-"}`,
    `Data do pagamento: ${paidAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`,
  ].join("\n");

  return { title: `Novo pedido pago ${orderNumber(order.id)}`, body };
}

/**
 * Sends the admin e-mail through Resend (https://resend.com/docs/api-reference/emails/send-email).
 * Skipped silently when the credentials are not configured yet; the in-panel
 * notification is always created regardless.
 */
export async function sendAdminEmail(subject: string, text: string) {
  const apiKey = process.env["RESEND_API_KEY"];
  const to = process.env["ADMIN_NOTIFICATION_EMAIL"];
  const from = process.env["ADMIN_NOTIFICATION_FROM"];
  if (!apiKey || !to || !from) {
    console.warn("[notifications] e-mail do admin não enviado: credenciais ausentes.");
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  if (!response.ok) {
    console.error("[notifications] falha ao enviar e-mail", response.status);
  }
}
