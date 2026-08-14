import { supabase } from "@/integrations/supabase/client";

type SupabaseLike = typeof supabase;

/**
 * Verifica se o usuário possui o papel de administrador.
 * A checagem é feita diretamente na tabela de papéis, protegida por RLS
 * (cada usuário só enxerga os próprios papéis).
 */
export async function isAdmin(userId: string, client: SupabaseLike = supabase): Promise<boolean> {
  const { data, error } = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) return false;
  return Boolean(data);
}
