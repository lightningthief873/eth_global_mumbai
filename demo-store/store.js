// ─── FacePay drop-in: a merchant adds USDT checkout in ~20 lines ───────────────
import { FacePayCheckout } from "../sdk/facepay-checkout.js";

const API_KEY = localStorage.getItem("facepay_api_key") || "";
const fp = new FacePayCheckout({
  apiKey: API_KEY,
  baseUrl: "http://localhost:8000",
  checkoutBaseUrl: "http://localhost:3000",
});

document.querySelector("#buy").addEventListener("click", async () => {
  const status = document.querySelector("#status");
  try {
    status.textContent = "Creating invoice…";
    const invoice = await fp.createInvoice({
      amountUSDT: "2.00",
      description: "Whitechain Coffee — Single Origin Latte",
      orderId: "order-" + Date.now(),
    });
    // Hand the customer off to the hosted USDT checkout.
    window.location.href = fp.checkoutUrl(invoice.id);
  } catch (e) {
    status.textContent = "Error: " + e.message;
  }
});
// ───────────────────────────────────────────────────────────────────────────────

// (demo-only) let the merchant paste their API key from the dashboard
const keyInput = document.querySelector("#apikey");
keyInput.value = API_KEY;
keyInput.addEventListener("change", (e) => {
  localStorage.setItem("facepay_api_key", e.target.value.trim());
  fp.apiKey = e.target.value.trim();
});
