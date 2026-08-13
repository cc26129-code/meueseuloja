import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "store_summary",
  title: "Resumo da loja",
  description:
    "Resumo com total de produtos, produtos esgotados ou com estoque baixo, pedidos pagos e faturamento confirmado.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);

    const [{ data: products, error: productsError }, { data: orders, error: ordersError }] =
      await Promise.all([
        supabase.from("products").select("id, stock_quantity"),
        supabase.from("orders").select("total_amount, payment_status"),
      ]);

    if (productsError) {
      return { content: [{ type: "text", text: productsError.message }], isError: true };
    }
    if (ordersError) {
      return { content: [{ type: "text", text: ordersError.message }], isError: true };
    }

    const list = products ?? [];
    const paid = (orders ?? []).filter((o) => o.payment_status === "paid");
    const summary = {
      products_total: list.length,
      products_out_of_stock: list.filter((p) => Number(p.stock_quantity) === 0).length,
      products_low_stock: list.filter(
        (p) => Number(p.stock_quantity) > 0 && Number(p.stock_quantity) <= 5,
      ).length,
      orders_total: (orders ?? []).length,
      orders_paid: paid.length,
      revenue_paid_brl:
        Math.round(paid.reduce((sum, o) => sum + Number(o.total_amount), 0) * 100) / 100,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(summary) }],
      structuredContent: summary,
    };
  },
});
