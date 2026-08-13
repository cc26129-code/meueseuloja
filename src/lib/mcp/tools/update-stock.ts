import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "update_stock",
  title: "Atualizar estoque",
  description:
    "Define a quantidade em estoque de um produto. Requer conta de administrador da loja.",
  inputSchema: {
    product_id: z.string().uuid().describe("ID do produto."),
    stock_quantity: z.number().int().min(0).max(100000).describe("Nova quantidade em estoque."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ product_id, stock_quantity }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("products")
      .update({ stock_quantity })
      .eq("id", product_id)
      .select("id, name, stock_quantity");

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data || data.length === 0) {
      return {
        content: [
          { type: "text", text: "Produto não encontrado ou sem permissão de administrador." },
        ],
        isError: true,
      };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(data[0]) }],
      structuredContent: { product: data[0] },
    };
  },
});
