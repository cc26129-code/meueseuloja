// Mercado Pago integration (server only).
// Official docs: https://www.mercadopago.com.br/developers/pt/reference/payments/_payments/post
// Webhook docs: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
import { createHmac, timingSafeEqual } from "node:crypto";

const API_BASE = "https://api.mercadopago.com";

export function getAccessToken(): string {
  const token = process.env["MERCADOPAGO_ACCESS_TOKEN"];
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");
  return token;
}

export type MpPixPayment = {
  id: number;
  status: string;
  status_detail?: string;
  date_of_expiration?: string | null;
  transaction_amount?: number;
  external_reference?: string | null;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
};

/** POST /v1/payments — creates a PIX charge. */
export async function createPixPayment(input: {
  amount: number;
  description: string;
  externalReference: string;
  idempotencyKey: string;
  notificationUrl: string;
  payerEmail: string;
  payerFirstName: string;
  expiresAt: Date;
}): Promise<MpPixPayment> {
  const response = await fetch(`${API_BASE}/v1/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify({
      transaction_amount: Number(input.amount.toFixed(2)),
      description: input.description,
      payment_method_id: "pix",
      external_reference: input.externalReference,
      notification_url: input.notificationUrl,
      date_of_expiration: input.expiresAt.toISOString(),
      payer: {
        email: input.payerEmail,
        first_name: input.payerFirstName,
      },
    }),
  });

  const payload = (await response.json().catch(() => null)) as MpPixPayment | null;
  if (!response.ok || !payload?.id) {
    console.error("[mercadopago] create payment failed", response.status, payload);
    throw new Error("Não foi possível criar a cobrança PIX no gateway.");
  }
  return payload;
}

/** GET /v1/payments/{id} — always re-read the real status from the gateway. */
export async function getPayment(paymentId: string): Promise<MpPixPayment | null> {
  const response = await fetch(`${API_BASE}/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  if (!response.ok) {
    console.error("[mercadopago] get payment failed", response.status);
    return null;
  }
  return (await response.json()) as MpPixPayment;
}

/**
 * Validates the x-signature header.
 * Manifest: id:<data.id>;request-id:<x-request-id>;ts:<ts>;
 */
export function verifyWebhookSignature(input: {
  signatureHeader: string | null;
  requestId: string | null;
  dataId: string | null;
}): boolean {
  const secret = process.env["MERCADOPAGO_WEBHOOK_SECRET"];
  if (!secret) {
    console.error("[mercadopago] MERCADOPAGO_WEBHOOK_SECRET não configurado.");
    return false;
  }
  if (!input.signatureHeader || !input.dataId) return false;

  let ts: string | undefined;
  let v1: string | undefined;
  for (const part of input.signatureHeader.split(",")) {
    const [rawKey, ...rest] = part.split("=");
    const key = rawKey?.trim();
    const value = rest.join("=").trim();
    if (key === "ts") ts = value;
    if (key === "v1") v1 = value;
  }
  if (!ts || !v1) return false;

  const id = /^[a-zA-Z0-9]+$/.test(input.dataId) ? input.dataId.toLowerCase() : input.dataId;
  const manifest = `id:${id};request-id:${input.requestId ?? ""};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Maps a Mercado Pago payment status to our order payment_status. */
export function mapPaymentStatus(
  status: string,
  statusDetail?: string,
): "pending" | "paid" | "failed" | "expired" | "cancelled" | null {
  switch (status) {
    case "approved":
ސ    case "authorized":
      return "paid";
    case "pending":
    case "in_process":
    case "in_mediation":
      return "pending";
    case "rejected":
      return "failed";
    case "cancelled":
      return statusDetail === "expired" ? "expired" : "cancelled";
    case "refunded":
    case "charged_back":
      return "cancelled";
    default:
      return null;
  }
}
