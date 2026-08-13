export type OrderItem = {
  product_id: string;
  name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
};

export type PaymentStatus = "pending" | "paid" | "failed" | "expired" | "cancelled";

export type PublicOrder = {
  id: string;
  total_amount: number;
  subtotal: number;
  shipping_amount: number;
  shipping_carrier: string | null;
  shipping_service: string | null;
  shipping_deadline: number | null;
  delivery_postal_code: string | null;
  delivery_address: string | null;
  tracking_code: string | null;
  payment_status: PaymentStatus;
  payment_method: string;
  items: OrderItem[];
  qr_code: string | null;
  qr_code_base64: string | null;
  expires_at: string | null;
  created_at: string;
  paid_at: string | null;
};

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  pending: "Aguardando pagamento",
  paid: "Pago",
  failed: "Falhou",
  expired: "Expirado",
  cancelled: "Cancelado",
};

export function orderNumber(id: string) {
  return id.slice(0, 8).toUpperCase();
}
