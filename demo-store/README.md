# Demo store

A standalone toy shop ("Whitechain Coffee") that integrates FacePay USDT checkout in
**~20 lines** — see [`store.js`](./store.js). It is intentionally *not* part of the main
app: it only uses the public SDK (`../sdk/facepay-checkout.js`) and the API key from the
merchant dashboard.

## Run

```bash
# from the repo root (so ../sdk resolves)
python3 -m http.server 8080
# open http://localhost:8080/demo-store/
```

1. Start the backend (`:8000`) and frontend (`:3000`) first.
2. In `/dashboard`, create a merchant and copy its API key.
3. Paste the key into the store, click **Checkout** → it creates an invoice via the SDK
   and redirects to the hosted USDT checkout at `/pay/<id>`.
