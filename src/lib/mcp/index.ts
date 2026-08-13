import { auth, defineMcp } from "@lovable.dev/mcp-js";

import listOrdersTool from "./tools/list-orders";
import listProductsTool from "./tools/list-products";
import storeSummaryTool from "./tools/store-summary";
import updateStockTool from "./tools/update-stock";

// The OAuth issuer must be the direct Supabase host; the project ref is the
// only value that survives publish unchanged.
const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "meueseuloja",
  title: "meueseuloja",
  version: "0.1.0",
  instructions:
    "Ferramentas da loja meueseuloja. Use list_products para consultar catálogo e estoque, update_stock para ajustar quantidades, list_orders para acompanhar pagamentos PIX e store_summary para uma visão geral. O estoque nunca é reduzido automaticamente por pagamentos.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  // Cast keeps exactOptionalPropertyTypes happy with the SDK tool type.
  tools: [
    listProductsTool,
    updateStockTool,
    listOrdersTool,
    storeSummaryTool,
  ] as unknown as Parameters<typeof defineMcp>[0]["tools"],
});
