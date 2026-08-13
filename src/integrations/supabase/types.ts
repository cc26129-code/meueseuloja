export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      addresses: {
        Row: {
          address_text: string;
          created_at: string;
          id: string;
          is_default: boolean;
          label: string;
          postal_code: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          address_text: string;
          created_at?: string;
          id?: string;
          is_default?: boolean;
          label?: string;
          postal_code?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          address_text?: string;
          created_at?: string;
          id?: string;
          is_default?: boolean;
          label?: string;
          postal_code?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      admin_notifications: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          order_id: string | null;
          read_at: string | null;
          title: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          order_id?: string | null;
          read_at?: string | null;
          title: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          order_id?: string | null;
          read_at?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admin_notifications_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          created_at: string;
          customer_contact: string;
          customer_name: string;
          customer_email: string | null;
          delivery_address: Json | null;
          delivery_postal_code: string | null;
          expires_at: string | null;
          gateway_payment_id: string | null;
          gateway_qr_code: string | null;
          gateway_qr_code_base64: string | null;
          id: string;
          items: Json;
          order_status: Database["public"]["Enums"]["order_status"];
          paid_at: string | null;
          payment_method: string;
          payment_status: Database["public"]["Enums"]["payment_status"];
          shipping_amount: number;
          total_amount: number;
          subtotal: number;
          updated_at: string;
          user_id: string | null;
          shipping_address: string | null;
          shipping_carrier: string | null;
          shipping_deadline: number | null;
          shipping_quote_id: string | null;
          shipping_quoted_at: string | null;
          shipping_service: string | null;
          shipping_service_id: string | null;
          tracking_code: string | null;
        };
        Insert: {
          created_at?: string;
          customer_contact: string;
          customer_name: string;
          customer_email?: string | null;
          delivery_address?: Json | null;
          delivery_postal_code?: string | null;
          expires_at?: string | null;
          gateway_payment_id?: string | null;
          gateway_qr_code?: string | null;
          gateway_qr_code_base64?: string | null;
          id?: string;
          items?: Json;
          order_status?: Database["public"]["Enums"]["order_status"];
          paid_at?: string | null;
          payment_method?: string;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          shipping_amount?: number;
          subtotal?: number;
          total_amount?: number;
          updated_at?: string;
          user_id?: string | null;
          shipping_address?: string | null;
          shipping_carrier?: string | null;
          shipping_deadline?: number | null;
          shipping_quote_id?: string | null;
          shipping_quoted_at?: string | null;
          shipping_service?: string | null;
          shipping_service_id?: string | null;
          tracking_code?: string | null;
        };
        Update: {
          created_at?: string;
          customer_contact?: string;
          customer_name?: string;
          customer_email?: string | null;
          delivery_address?: Json | null;
          delivery_postal_code?: string | null;
          expires_at?: string | null;
          gateway_payment_id?: string | null;
          gateway_qr_code?: string | null;
          gateway_qr_code_base64?: string | null;
          id?: string;
          items?: Json;
          order_status?: Database["public"]["Enums"]["order_status"];
          paid_at?: string | null;
          payment_method?: string;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          shipping_amount?: number;
          subtotal?: number;
          total_amount?: number;
          updated_at?: string;
          user_id?: string | null;
          shipping_address?: string | null;
          shipping_carrier?: string | null;
          shipping_deadline?: number | null;
          shipping_quote_id?: string | null;
          shipping_quoted_at?: string | null;
          shipping_service?: string | null;
          shipping_service_id?: string | null;
          tracking_code?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          created_at: string;
          id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          quantity: number;
          subtotal: number;
          unit_price: number;
          variant: Json;
        };
        Insert: {
          created_at?: string;
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          quantity: number;
          subtotal: number;
          unit_price: number;
          variant?: Json;
        };
        Update: {
          created_at?: string;
          id?: string;
          order_id?: string;
          product_id?: string | null;
          product_name?: string;
          quantity?: number;
          subtotal?: number;
          unit_price?: number;
          variant?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          amount: number;
          created_at: string;
          id: string;
          method: string;
          order_id: string;
          paid_at: string | null;
          provider: string;
          provider_payment_id: string | null;
          status: Database["public"]["Enums"]["payment_status"];
          updated_at: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          id?: string;
          method: string;
          order_id: string;
          paid_at?: string | null;
          provider: string;
          provider_payment_id?: string | null;
          status?: Database["public"]["Enums"]["payment_status"];
          updated_at?: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          id?: string;
          method?: string;
          order_id?: string;
          paid_at?: string | null;
          provider?: string;
          provider_payment_id?: string | null;
          status?: Database["public"]["Enums"]["payment_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_path: string | null;
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_path?: string | null;
          created_at?: string;
          email: string;
          full_name: string;
          id: string;
          updated_at?: string;
        };
        Update: {
          avatar_path?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      favorites: {
        Row: { created_at: string; product_id: string; user_id: string };
        Insert: { created_at?: string; product_id: string; user_id: string };
        Update: { created_at?: string; product_id?: string; user_id?: string };
        Relationships: [];
      };
      cart_items: {
        Row: {
          created_at: string;
          product_id: string;
          quantity: number;
          updated_at: string;
          user_id: string;
          variant: Json;
          variant_key: string;
        };
        Insert: {
          created_at?: string;
          product_id: string;
          quantity: number;
          updated_at?: string;
          user_id: string;
          variant?: Json;
          variant_key?: string;
        };
        Update: {
          created_at?: string;
          product_id?: string;
          quantity?: number;
          updated_at?: string;
          user_id?: string;
          variant?: Json;
          variant_key?: string;
        };
        Relationships: [];
      };
      payment_webhook_events: {
        Row: {
          event_key: string;
          id: string;
          payload: Json | null;
          processed_at: string;
          provider: string;
        };
        Insert: {
          event_key: string;
          id?: string;
          payload?: Json | null;
          processed_at?: string;
          provider?: string;
        };
        Update: {
          event_key?: string;
          id?: string;
          payload?: Json | null;
          processed_at?: string;
          provider?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          created_at: string;
          description: string;
          height_cm: number | null;
          id: string;
          image_url: string | null;
          length_cm: number | null;
          name: string;
          price: number;
          stock_quantity: number;
          updated_at: string;
          weight_kg: number | null;
          width_cm: number | null;
        };
        Insert: {
          created_at?: string;
          description?: string;
          height_cm?: number | null;
          id?: string;
          image_url?: string | null;
          length_cm?: number | null;
          name: string;
          price?: number;
          stock_quantity?: number;
          updated_at?: string;
          weight_kg?: number | null;
          width_cm?: number | null;
        };
        Update: {
          created_at?: string;
          description?: string;
          height_cm?: number | null;
          id?: string;
          image_url?: string | null;
          length_cm?: number | null;
          name?: string;
          price?: number;
          stock_quantity?: number;
          updated_at?: string;
          weight_kg?: number | null;
          width_cm?: number | null;
        };
        Relationships: [];
      };
      shipping_provider_tokens: {
        Row: {
          access_token: string;
          expires_at: string | null;
          provider: string;
          refresh_token: string | null;
          updated_at: string;
        };
        Insert: {
          access_token: string;
          expires_at?: string | null;
          provider: string;
          refresh_token?: string | null;
          updated_at?: string;
        };
        Update: {
          access_token?: string;
          expires_at?: string | null;
          provider?: string;
          refresh_token?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      shipping_quotes: {
        Row: {
          cart_fingerprint: string;
          created_at: string;
          destination_postal_code: string;
          expires_at: string;
          id: string;
          options: Json;
          user_id: string;
        };
        Insert: {
          cart_fingerprint: string;
          created_at?: string;
          destination_postal_code: string;
          expires_at?: string;
          id?: string;
          options?: Json;
          user_id: string;
        };
        Update: {
          cart_fingerprint?: string;
          created_at?: string;
          destination_postal_code?: string;
          expires_at?: string;
          id?: string;
          options?: Json;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shipping_quotes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "user";
      order_status:
        | "awaiting_payment"
        | "payment_approved"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled";
      payment_status: "pending" | "paid" | "failed" | "expired" | "cancelled";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      order_status: [
        "awaiting_payment",
        "payment_approved",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      payment_status: ["pending", "paid", "failed", "expired", "cancelled"],
    },
  },
} as const;
