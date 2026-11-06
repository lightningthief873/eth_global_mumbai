const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface Invoice {
  id: string;
  status: "open" | "paid" | "refunded" | "partially_refunded";
  amount_units: number;
  amount_usdt: string;
  refunded_units: number;
  refunded_usdt: string;
  currency: string;
  description: string | null;
  order_id: string | null;
  merchant_address: string;
  payer_address: string | null;
  tx_hash: string | null;
  refund_tx_hash: string | null;
  explorer_url: string | null;
  refund_explorer_url: string | null;
  due_date: string | null;
  created_at: string;
  paid_at: string | null;
  pay_url?: string;
}

export interface Merchant {
  api_key: string;
  name: string;
  address: string;
  webhook_url: string | null;
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail ?? `HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export const checkout = {
  createMerchant: (name: string, webhook_url?: string) =>
    req<Merchant>("/api/merchants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, webhook_url }),
    }),

  createInvoice: (apiKey: string, amount_usdt: string, description?: string, order_id?: string) =>
    req<Invoice>("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
      body: JSON.stringify({ amount_usdt, description, order_id }),
    }),

  listInvoices: (apiKey: string) =>
    req<Invoice[]>("/api/merchants/invoices", { headers: { "X-API-Key": apiKey } }),

  getInvoice: (id: string) => req<Invoice>(`/api/invoices/${id}`),

  payByFace: (id: string, image: Blob) => {
    const fd = new FormData();
    fd.append("image", image, "face.jpg");
    return req<Invoice>(`/api/invoices/${id}/pay`, { method: "POST", body: fd });
  },

  payByAddress: (id: string, payer_address: string) => {
    const fd = new FormData();
    fd.append("payer_address", payer_address);
    return req<Invoice>(`/api/invoices/${id}/pay`, { method: "POST", body: fd });
  },

  refund: (apiKey: string, id: string, amount_usdt?: string) =>
    req<Invoice>(`/api/invoices/${id}/refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
      body: JSON.stringify({ amount_usdt }),
    }),
};
