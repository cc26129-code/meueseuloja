export type ShippingCartItem = {
  id: string;
  qty: number;
};

export type ShippingOption = {
  service_id: string;
  carrier: string;
  service: string;
  price: number;
  delivery_days: number;
};

export type ShippingQuote = {
  id: string;
  postal_code: string;
  expires_at: string;
  options: ShippingOption[];
};
