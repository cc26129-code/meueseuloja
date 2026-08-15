import { createHash } from "node:crypto";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { ShippingCartItem, ShippingOption } from "./shipping.types";

type ShippingProduct = {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  weight_kg: number | null;
  height_cm: number | null;
  width_cm: number | null;
  length_cm: number | null;
  updated_at: string;
};

type StoredProviderToken = {
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
};

export type ResolvedShippingCart = {
  products: ShippingProduct[];
  quantities: Map<string, number>;
  fingerprint: string;
};

const QUOTE_TIMEOUT_MS = 12_000;

function getAuthMode() {
  return process.env["MELHOR_ENVIO_AUTH_MODE"] === "personal" ? "personal" : "oauth";
}

function normalizeAccessToken(value: string | undefined) {
  if (!value) return null;
  let token = value.trim().replace(/^Bearer\\s+/i, "").trim();
  const wrappedInMatchingQuotes =
    token.length >= 2 &&
    ((token.startsWith('"') && token.endsWith('"')) ||
      (token.startsWith("'") && token.endsWith("'")));
  if (wrappedInMatchingQuotes) token = token.slice(1, -1).trim();
  return token || null;
}

function getPersonalAccessToken() {
  return normalizeAccessToken(
    process.env["MELHOR_ENVIO_PERSONAL_TOKEN"] ??
      process.env["MELHOR_ENVIO_ACCESS_TOKEN"],
  );
}

function getBaseUrl() {
  return process.env["MELHOR_ENVIO_ENVIRONMENT"] === "production"
    ? "https://melhorenvio.com.br"
    : "https://sandbox.melhorenvio.com.br";
}

export function normalizePostalCode(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!/^\d{8}$/.test(digits)) throw new Error("Informe um CEP válido com 8 números.");
  return digits;
}

function positiveNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function parseExpiration(value: string | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

async function loadStoredToken(): Promise<StoredProviderToken | null> {
  const { data } = await supabaseAdmin
    .from("shipping_provider_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("provider", "melhor_envio")
    .maybeSingle();
  return data ?? null;
}

async function saveToken(token: StoredProviderToken) {
  const { error } = await supabaseAdmin.from("shipping_provider_tokens").upsert({
    provider: "melhor_envio",
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    expires_at: token.expires_at,
  });
  if (error) throw new Error("Não foi possível salvar a autenticação do Melhor Envio.");
}

async function refreshToken(refreshToken: string): Promise<StoredProviderToken> {
  const clientId = process.env["MELHOR_ENVIO_CLIENT_ID"];
  const clientSecret = process.env["MELHOR_ENVIO_CLIENT_SECRET"];
  const userAgent = process.env["MELHOR_ENVIO_USER_AGENT"];
  if (!clientId || !clientSecret || !userAgent) {
    throw new Error("A autenticação do Melhor Envio expirou e o OAuth não está configurado.");
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });
  const response = await fetch(`${getBaseUrl()}/oauth/token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": userAgent,
    },
    body: body.toString(),
  });
  if (!response.ok) {
    let providerMessage = "";
    try {
      const errorPayload = (await response.json()) as {
        error?: string;
        message?: string;
      };
      providerMessage = errorPayload.message ?? errorPayload.error ?? "";
    } catch {
      // The provider may return an empty or non-JSON error body.
    }
    console.error("[Shipping] Melhor Envio token refresh failed", {
      status: response.status,
      providerMessage,
      environment: process.env["MELHOR_ENVIO_ENVIRONMENT"] ?? "sandbox",
    });
    if (response.status === 400 || response.status === 401) {
      throw new Error(
        "Os tokens ou o aplicativo do Melhor Envio não pertencem ao ambiente configurado.",
      );
    }
    throw new Error("Não foi possível renovar o acesso ao Melhor Envio.");
  }

  const payload = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
  if (!payload.access_token) throw new Error("O Melhor Envio não retornou um token válido.");

  const token = {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token ?? refreshToken,
    expires_at: payload.expires_in
      ? new Date(Date.now() + payload.expires_in * 1000).toISOString()
      : null,
  };
  await saveToken(token);
  return token;
}

async function getAccessToken(forceRefresh = false) {
  if (getAuthMode() === "personal") {
    const accessToken = getPersonalAccessToken();
    if (!accessToken) {
      throw new Error("MELHOR_ENVIO_ACCESS_TOKEN não foi configurado no servidor.");
    }
    return accessToken;
  }

  let token = await loadStoredToken();
  if (!token) {
    const accessToken = normalizeAccessToken(process.env["MELHOR_ENVIO_ACCESS_TOKEN"]);
    if (!accessToken) throw new Error("MELHOR_ENVIO_ACCESS_TOKEN não foi configurado no servidor.");
    token = {
      access_token: accessToken,
      refresh_token: process.env["MELHOR_ENVIO_REFRESH_TOKEN"] ?? null,
      expires_at: parseExpiration(process.env["MELHOR_ENVIO_TOKEN_EXPIRES_AT"]),
    };
    await saveToken(token);
  }

  const expiresSoon = token.expires_at
    ? new Date(token.expires_at).getTime() <= Date.now() + 5 * 60 * 1000
    : false;
  if ((forceRefresh || expiresSoon) && token.refresh_token) {
    token = await refreshToken(token.refresh_token);
  }
  return token.access_token;
}

export async function resolveShippingCart(
  requestedItems: ShippingCartItem[],
): Promise<ResolvedShippingCart> {
  const quantities = new Map<string, number>();
  for (const item of requestedItems) {
    quantities.set(item.id, (quantities.get(item.id) ?? 0) + item.qty);
  }
  const ids = [...quantities.keys()];
  const { data, error } = await supabaseAdmin
    .from("products")
    .select(
      "id, name, price, stock_quantity, weight_kg, height_cm, width_cm, length_cm, updated_at",
    )
    .in("id", ids);
  if (error) {
    console.error("[Shipping] Product validation failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    const reason = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
    if (
      reason.includes("api key") ||
      reason.includes("jwt") ||
      reason.includes("unauthorized") ||
      reason.includes("permission")
    ) {
      throw new Error(
        "A chave administrativa do Supabase externo está ausente ou inválida no servidor.",
      );
    }
    if (
      reason.includes("schema cache") ||
      reason.includes("column") ||
      reason.includes("relation")
    ) {
      throw new Error("O banco do Supabase externo ainda não possui todos os campos do frete.");
    }
    throw new Error("Não foi possível validar os produtos para calcular o frete.");
  }

  const products = (data ?? []) as ShippingProduct[];
  const byId = new Map(products.map((product) => [product.id, product]));
  const signature: unknown[] = [];
  for (const [id, qty] of [...quantities].sort(([a], [b]) => a.localeCompare(b))) {
    const product = byId.get(id);
    if (!product) throw new Error("Um dos produtos não está mais disponível.");
    if (qty > Number(product.stock_quantity)) {
      throw new Error(`Quantidade indisponível para ${product.name}.`);
    }

    const physical = [
      positiveNumber(product.weight_kg),
      positiveNumber(product.height_cm),
      positiveNumber(product.width_cm),
      positiveNumber(product.length_cm),
    ];
    if (physical.some((value) => value === null)) {
      throw new Error(
        `O produto “${product.name}” ainda não possui peso e dimensões válidos. Atualize-o no painel da loja.`,
      );
    }
    signature.push([id, qty, Number(product.price), ...physical, product.updated_at]);
  }

  if (products.length === 0) throw new Error("Carrinho vazio.");
  return {
    products,
    quantities,
    fingerprint: createHash("sha256").update(JSON.stringify(signature)).digest("hex"),
  };
}

function parseOptions(payload: unknown): ShippingOption[] {
  if (!Array.isArray(payload)) return [];
  const options: ShippingOption[] = [];
  for (const raw of payload) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    if (item["error"]) continue;
    const price = positiveNumber(item["custom_price"] ?? item["price"]);
    const deliveryDays = positiveNumber(
      item["custom_delivery_time"] ?? item["delivery_time"],
    );
    const company =
      item["company"] && typeof item["company"] === "object"
        ? (item["company"] as Record<string, unknown>)
        : {};
    if (!price || !deliveryDays || item["id"] == null) continue;
    options.push({
      service_id: String(item["id"]),
      carrier: String(company["name"] ?? "Transportadora"),
      service: String(item["name"] ?? "Entrega"),
      price: Math.round(price * 100) / 100,
      delivery_days: Math.ceil(deliveryDays),
    });
  }
  return options.sort((a, b) => a.price - b.price);
}

async function requestQuote(
  cart: ResolvedShippingCart,
  destinationPostalCode: string,
  forceRefresh = false,
): Promise<ShippingOption[]> {
  const originPostalCode = normalizePostalCode(process.env["STORE_ORIGIN_POSTAL_CODE"] ?? "");
  const userAgent = process.env["MELHOR_ENVIO_USER_AGENT"];
  if (!userAgent) throw new Error("MELHOR_ENVIO_USER_AGENT não foi configurado no servidor.");

  const accessToken = await getAccessToken(forceRefresh);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), QUOTE_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}/api/v2/me/shipment/calculate`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": userAgent,
      },
      body: JSON.stringify({
        from: { postal_code: originPostalCode },
        to: { postal_code: destinationPostalCode },
        products: cart.products.map((product) => ({
          id: product.id,
          width: Number(product.width_cm),
          height: Number(product.height_cm),
          length: Number(product.length_cm),
          weight: Number(product.weight_kg),
          insurance_value: Number(product.price),
          quantity: cart.quantities.get(product.id) ?? 1,
        })),
        options: { receipt: false, own_hand: false },
      }),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("O cálculo do frete demorou demais. Tente novamente.");
    }
    throw new Error("O Melhor Envio está temporariamente indisponível.");
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 401) {
    if (getAuthMode() === "oauth" && !forceRefresh) {
      return requestQuote(cart, destinationPostalCode, true);
    }
    throw new Error(
      getAuthMode() === "personal"
        ? "O token pessoal do Melhor Envio foi rejeitado. Gere um token no mesmo ambiente configurado e atualize o Secret."
        : "O acesso OAuth do Melhor Envio foi rejeitado. Autorize novamente o aplicativo.",
    );
  }
  if (!response.ok) {
    if (response.status === 422)
      throw new Error("CEP ou dimensões não atendidos pelas transportadoras.");
    throw new Error("Não foi possível consultar as transportadoras agora.");
  }

  const options = parseOptions(await response.json());
  if (options.length === 0) {
    throw new Error("Nenhuma opção de frete foi encontrada para este CEP.");
  }
  return options;
}

export async function calculateShipping(
  requestedItems: ShippingCartItem[],
  destinationPostalCode: string,
) {
  const postalCode = normalizePostalCode(destinationPostalCode);
  const cart = await resolveShippingCart(requestedItems);
  const options = await requestQuote(cart, postalCode);
  return { postalCode, cart, options };
}
