import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_orders",
  title: "Listar pedidos",
  description:
    "Lista os pedidos PIX da loja com cliente, itens, total e status do pagamento. Requer conta de administrador.",
  inputSchema: {
    status: z
      .enum(["all", "pending", "paid", "failed", "expired", "cancelled"])
      .default("all")
      .describe("Filtro por status do pagamento."),
    limit: z.number().int().min(1).max(100).default(20).describe("Máximo de pedidos retornados."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("orders")
      .select(
        "id, customer_name, customer_contact, items, total_amount, payment_status, payment_method, created_at, paid_at",
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status !== "all") query = query.eq("payment_status", status);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { orders: data ?? [] },
    };
  },
});
