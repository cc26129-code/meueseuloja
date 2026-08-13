import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_products",
  title: "Listar produtos",
  description:
    "Lista os produtos da loja com preço, descrição e quantidade em estoque. Permite filtrar por status de estoque.",
  inputSchema: {
    stock_filter: z
      .enum(["all", "in_stock", "low_stock", "out_of_stock"])
      .default("all")
      .describe("Filtro de estoque: todos, disponíveis, estoque baixo (1 a 5) ou esgotados."),
    limit: z.number().int().min(1).max(100).default(50).describe("Máximo de produtos retornados."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ stock_filter, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("products")
      .select("id, name, price, description, stock_quantity, updated_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (stock_filter === "in_stock") query = query.gt("stock_quantity", 5);
    if (stock_filter === "low_stock")
      query = query.gte("stock_quantity", 1).lte("stock_quantity", 5);
    if (stock_filter === "out_of_stock") query = query.eq("stock_quantity", 0);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { products: data ?? [] },
    };
  },
});
