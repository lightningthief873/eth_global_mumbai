/**
 * FacePay Checkout SDK — drop-in USDT payments on Whitechain.
 *
 * A merchant creates an invoice from their own app/store, redirects the customer to the
 * hosted checkout, and (optionally) waits for settlement. Works in the browser or Node.
 *
 *   import { FacePayCheckout } from "facepay-checkout";
 *   const fp = new FacePayCheckout({ apiKey: "sk_..." });
 *   const invoice = await fp.createInvoice({ amountUSDT: "2.00", orderId: "order-1" });
 *   location.href = fp.checkoutUrl(invoice.id);
 */
export class FacePayCheckout {
  constructor({
    apiKey,
    baseUrl = "http://localhost:8000",
    checkoutBaseUrl = "http://localhost:3000",
  } = {}) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.checkoutBaseUrl = checkoutBaseUrl.replace(/\/$/, "");
  }

  async createInvoice({ amountUSDT, description, orderId, dueDate } = {}) {
    const res = await fetch(`${this.baseUrl}/api/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": this.apiKey },
      body: JSON.stringify({
        amount_usdt: String(amountUSDT),
        description,
        order_id: orderId,
        due_date: dueDate,
      }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail ?? `HTTP ${res.status}`);
    return res.json();
  }

  async getInvoice(id) {
    const res = await fetch(`${this.baseUrl}/api/invoices/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  checkoutUrl(id) {
    return `${this.checkoutBaseUrl}/pay/${id}`;
  }

  /** Poll until the invoice leaves the "open" state (paid). Returns the final invoice. */
  async waitForPaid(id, { interval = 2500, timeout = 300000 } = {}) {
    const start = Date.now();
    for (;;) {
      const inv = await this.getInvoice(id);
      if (inv.status !== "open") return inv;
      if (Date.now() - start > timeout) throw new Error("Timed out waiting for payment");
      await new Promise((r) => setTimeout(r, interval));
    }
  }
}

export default FacePayCheckout;
