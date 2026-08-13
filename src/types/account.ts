export type Profile = {
  id: string;
  full_name: string;
  email: string;
  avatar_path: string | null;
  avatar_url: string | null;
  address_id: string | null;
  address: string;
};

export type OrderStatus =
  "awaiting_payment" | "payment_approved" | "processing" | "shipped" | "delivered" | "cancelled";

export const orderStatusLabel: Record<OrderStatus, string> = {
  awaiting_payment: "Aguardando pagamento",
  payment_approved: "Pagamento aprovado",
  processing: "Em processamento",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};
