const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ---------- wallet ----------

export interface BalanceResponse {
  address: string;
  wbt_wei: string;
  pwsr_wei: string;
  wbt: string;
  pwsr: string;
}

export const wallet = {
  create: () => request<{ address: string }>("/api/wallet/create", { method: "POST" }),
  balance: (address: string) =>
    request<BalanceResponse>("/api/wallet/balance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    }),
};

// ---------- face ----------

export interface EnrollResponse {
  address: string;
  commitment: string;
  tx_hash: string;
  explorer_url: string;
}

export interface RecognizeResponse {
  address: string;
  distance: number;
  confidence: number;
}

export const face = {
  enroll: (image: Blob, alias?: string, address?: string) => {
    const fd = new FormData();
    fd.append("image", image, "capture.jpg");
    if (alias) fd.append("alias", alias);
    if (address) fd.append("address", address);
    return request<EnrollResponse>("/api/face/enroll", { method: "POST", body: fd });
  },

  recognize: (image: Blob) => {
    const fd = new FormData();
    fd.append("image", image, "capture.jpg");
    return request<RecognizeResponse>("/api/face/recognize", { method: "POST", body: fd });
  },

  status: (address: string) =>
    request<{ address: string; enrolled: boolean }>(`/api/face/status/${address}`),
};

// ---------- payment ----------

export interface ChargeResponse {
  tx_hash: string;
  amount_wei: string;
  pwsr_wei: string;
  customer: string;
  merchant: string;
  explorer_url: string;
}

export interface PaymentRecord {
  id: number;
  merchant: string;
  amount_wei: string;
  amount_wbt: string;
  pwsr_wei: string;
  pwsr: string;
  tx_hash: string;
  explorer_url: string;
  created_at: string;
}

export const payment = {
  charge: (opts: {
    merchant: string;
    amount_wbt: string;
    image?: Blob;
    address?: string;
  }) => {
    const fd = new FormData();
    fd.append("merchant", opts.merchant);
    fd.append("amount_wbt", opts.amount_wbt);
    if (opts.image) fd.append("image", opts.image, "capture.jpg");
    if (opts.address) fd.append("address", opts.address);
    return request<ChargeResponse>("/api/payment/charge", { method: "POST", body: fd });
  },

  history: (address: string) =>
    request<PaymentRecord[]>(`/api/payment/history/${address}`),
};
