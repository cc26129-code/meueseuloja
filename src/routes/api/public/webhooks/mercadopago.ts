import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/webhooks/mercadopago")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { verifyWebhookSignature } = await import("@/lib/mercadopago.server");
        const { settlePaymentFromGateway } = await import("@/lib/payments.server");

        const url = new URL(request.url);
        const raw = await request.text();

        let payload: Record<string, unknown> = {};
        try {
          payload = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
        } catch {
          return new Response("Invalid body", { status: 400 });
        }

        const data = payload["data"] as { id?: string | number } | undefined;
        const dataId =
          url.searchParams.get("data.id") ??
          url.searchParams.get("id") ??
          (data?.id != null ? String(data.id) : null);

        const type = (payload["type"] as string | undefined) ?? url.searchParams.get("type");

        const valid = verifyWebhookSignature({
          signatureHeader: request.headers.get("x-signature"),
          requestId: request.headers.get("x-request-id"),
          dataId,
        });
        if (!valid) return new Response("Invalid signature", { status: 401 });

        if (type !== "payment" || !dataId) {
          // Acknowledged but ignored: not a payment notification.
          return new Response("ignored", { status: 200 });
        }

        try {
          await settlePaymentFromGateway(dataId, payload);
        } catch (error) {
          console.error("[webhook] mercadopago processing failed", error);
          return new Response("error", { status: 500 });
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
