# FacePay

> Drop-in **USDT checkout, invoicing and refunds** for merchants on **Whitechain** — a customer pays by **face** or wallet, settlement happens on-chain in USDT, and the merchant can refund in one click.

[![Whitechain](https://img.shields.io/badge/Whitechain-Sepolia_1874-blue)](https://whitechain.io)
[![USDT](https://img.shields.io/badge/Settles_in-USDT-26A17B)](https://explorer.testnet.whitechain.io/address/0xcedfB56113143d55b2358b8CFbB0dEB5Ad2f55a7)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![Python](https://img.shields.io/badge/Python-3.13-green)](https://python.org)

---

## What it is

FacePay is a payment processor a real store can plug into. A merchant creates a payment
link / invoice from their app in **~20 lines**, the customer pays it in **USDT on
Whitechain** — authorising with their **face** (returning customers) or a wallet address —
and the merchant sees it settle and can **refund** (full or partial) with one click. Every
payment is bound to an invoice and recorded on-chain, so the customer gets a verifiable
receipt.

- **Merchant view:** `/dashboard` — onboard, create payment links, watch invoices settle, refund.
- **Customer view:** `/pay/<invoiceId>` — hosted USDT checkout, pay by face or wallet.
- **Separate demo store:** `demo-store/` — a toy shop that adds FacePay in ~20 lines.

### Why this needs on-chain stablecoin settlement on Whitechain

A card rail or PayPal can't do what this flow needs: **instant, final, cross-border
settlement in a dollar-stable unit with no chargebacks and a public receipt both parties
can verify.** On Whitechain the payment clears in ~1s to a stablecoin the merchant holds
immediately (no 2–3 day payout, no 2.9%+ fees, no interchange, no acquiring bank, works
for a contractor billing a client in another country). The refund is the *same* rail — a
single on-chain transaction the customer can independently check — instead of an opaque
reversal that may take a week. Doing it in USDT (not a local-currency token or a
self-issued coin) means the merchant is paid in real dollars, and doing it on Whitechain's
low-fee L2 makes relayer-sponsored, gasless-for-the-payer checkout economical even for a
$2 coffee.

---

## Drop-in integration (the ~20 lines)

```js
import { FacePayCheckout } from "facepay-checkout";

const fp = new FacePayCheckout({ apiKey: "sk_live_…" });        // from the dashboard

// When the customer clicks "Checkout":
const invoice = await fp.createInvoice({
  amountUSDT: "2.00",
  description: "Single Origin Latte",
  orderId: "order-1042",
});
window.location.href = fp.checkoutUrl(invoice.id);               // hosted USDT checkout

// …and in your webhook handler, you get { event: "invoice.paid", invoice } with the tx hash.
```

See [`demo-store/store.js`](./demo-store/store.js) for a complete, separate store that does exactly this.

---

## Live on-chain proof (Whitechain Sepolia)

Real payments in the official **USDT** (`0xcedfB56113143d55b2358b8CFbB0dEB5Ad2f55a7`),
settled through `PaymentHub`:

| Action | Amount | Explorer |
| --- | --- | --- |
| Invoice paid in USDT (`PaymentHub`) | 1.00 USDT | [`0x200f32…f2e57`](https://explorer.testnet.whitechain.io/tx/0x200f32af5efebfd9f8a155b4078576b2be30a9020822aa610e52cbb7266f2e57) |
| Invoice paid **by face** | 2.00 USDT | [`0x86e215…c2fb2`](https://explorer.testnet.whitechain.io/tx/0x86e215e720ec541c1885bebc05690ddbe88029f786d49279add531791e7c2fb2) |
| One-click partial refund | 0.50 USDT | [`0x9c7bc5…0cc9c0`](https://explorer.testnet.whitechain.io/tx/0x9c7bc55f5fa7a119fd1f2a5ba15b710cb4e0baf611e0b0ea0abc1cfd580cc9c0) |

`PaymentHub` contract: [`0x8E95c4D0915D5d90D5633b4a245470b462147657`](https://explorer.testnet.whitechain.io/address/0x8E95c4D0915D5d90D5633b4a245470b462147657) (verified).

---

## Architecture

```
Merchant app / demo store
      │  FacePayCheckout SDK → POST /api/invoices (X-API-Key)
      ▼
Backend API (FastAPI)                         Customer
  ├── invoice_service   create / settle / refund        │ opens /pay/<id>
  ├── usdt_service      EIP-2612 permit signing          │ pays by face or wallet
  ├── face_service      ArcFace recognition (express)    ▼
  └── relayer (sponsors gas)  ───────────────►  PaymentHub.payWithPermit()
                                                     │  (gasless for payer)
                                                     ▼
                                          Whitechain Sepolia
                                   ┌───────────────────────────┐
                                   │ PaymentHub   invoice + refund│
                                   │ USDT (Tether) transferFrom   │  payer → merchant
                                   └───────────────────────────┘
                                   emits InvoicePaid / InvoiceRefunded  = on-chain receipt
```

**How the payer pays no gas:** the payer signs an EIP-2612 `permit` off-chain (no WBT
needed); the relayer submits `PaymentHub.payWithPermit` and covers gas in WBT. For
returning customers the backend holds a custodial key, so a face match authorises the
permit — the customer does nothing but look at the camera.

---

## Repo layout

```
contracts/      Foundry — PaymentHub (USDT invoices + refunds), tests, deploy
sdk/            Framework-agnostic FacePayCheckout SDK (facepay-checkout.js)
demo-store/     A SEPARATE toy store that integrates the SDK in ~20 lines
backend/        FastAPI — invoices, USDT settlement, refunds, face recognition
frontend/       Next.js — /dashboard (merchant) and /pay/[id] (customer checkout)
```

---

## Setup & run

### Prerequisites
- Python 3.13 + [uv](https://docs.astral.sh/uv/), Node 20+ + [bun](https://bun.sh), [Foundry](https://book.getfoundry.sh)
- A relayer wallet funded with test **WBT** (gas) and test **USDT**. Get WBT from the
  [faucet](https://faucet.testnet.whitechain.io), swap some for USDT on
  [YetiTrade](https://testnet.yetitrade.fi). See [Relayer wallet](#relayer-wallet).

### 1. Contracts (already deployed — redeploy only if you want your own)
```bash
cd contracts
forge install foundry-rs/forge-std --no-git
forge install OpenZeppelin/openzeppelin-contracts@v5.1.0 --no-git   # v5.1.0: prague-safe (no Osaka clz)
forge test
forge script script/DeployPaymentHub.s.sol:DeployPaymentHub \
  --rpc-url https://rpc.testnet.whitechain.io --private-key $PRIVATE_KEY --broadcast \
  --verify --verifier blockscout --verifier-url https://explorer.testnet.whitechain.io/api/
```

### 2. Backend
```bash
cd backend && cp .env.example .env   # set RELAYER_PRIVATE_KEY, WALLET_ENCRYPTION_KEY
uv sync && uv run main.py            # http://localhost:8000  (docs at /docs)
```

### 3. Frontend
```bash
cd frontend && cp .env.example .env.local
bun install && bun run dev           # http://localhost:3000
```

### 4. Demo store (separate app)
```bash
# from the repo root, so the store can import ../sdk
python3 -m http.server 8080
# open http://localhost:8080/demo-store/  — paste your dashboard API key, click Checkout
```

### Try the full flow
1. `/enroll` — a customer enrolls their face (gets a custodial wallet seeded with test USDT).
2. `/dashboard` — create a merchant, copy the API key, create a payment link.
3. Open the link (or the demo store) → `/pay/<id>` → **pay by face** → settles in USDT.
4. Back on `/dashboard` → **Refund** (full or partial) → settles on-chain.

---

## Contracts

| Contract | Address (Whitechain Sepolia) | Role |
| --- | --- | --- |
| `PaymentHub` | [`0x8E95c4D0915D5d90D5633b4a245470b462147657`](https://explorer.testnet.whitechain.io/address/0x8E95c4D0915D5d90D5633b4a245470b462147657) | Invoice-bound USDT settlement + full/partial refunds |
| USDT (Tether, official) | [`0xcedfB56113143d55b2358b8CFbB0dEB5Ad2f55a7`](https://explorer.testnet.whitechain.io/address/0xcedfB56113143d55b2358b8CFbB0dEB5Ad2f55a7) | The settlement asset (6 decimals, EIP-2612 permit) |
| `BiometricRegistry` | [`0x6E64d396F09550278c75839A2E4bc0A2848e3eB0`](https://explorer.testnet.whitechain.io/address/0x6E64d396F09550278c75839A2E4bc0A2848e3eB0) | Face-enrollment record (express path) |

Solidity `0.8.30`, `evm_version = prague`, OpenZeppelin v5.1.0. 7 `PaymentHub` tests
(`forge test`) cover pay, permit, and full/partial refunds.

---

## API reference

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/merchants` | Onboard a merchant → `{ api_key, address }` |
| `POST` | `/api/invoices` | Create an invoice / payment link (needs `X-API-Key`) |
| `GET`  | `/api/invoices/{id}` | Public invoice status (for checkout + polling) |
| `GET`  | `/api/merchants/invoices` | List a merchant's invoices (needs `X-API-Key`) |
| `POST` | `/api/invoices/{id}/pay` | Pay in USDT — multipart `image` (face) or `payer_address` |
| `POST` | `/api/invoices/{id}/refund` | Full/partial refund (needs `X-API-Key`) |

---

## Relayer wallet

The relayer sponsors gas, seeds demo wallets, and submits permit-based payments.
Keep it funded with WBT (gas) and USDT (demo balances).

| | |
| --- | --- |
| Address | [`0x302478941faCdb2c9Dbb412B60e35354F0AF0027`](https://explorer.testnet.whitechain.io/address/0x302478941faCdb2c9Dbb412B60e35354F0AF0027) |
| WBT | [faucet.testnet.whitechain.io](https://faucet.testnet.whitechain.io) |
| USDT | swap WBT→USDT on [testnet.yetitrade.fi](https://testnet.yetitrade.fi) |

Public address only; the private key lives in `backend/.env` (git-ignored).

---

## Current limitations

- **Custodial express path:** for face payments the backend holds the customer's key (a
  demo tradeoff). The wallet-address path and the permit design are ready for non-custodial
  / embedded wallets.
- **No liveness check** on face capture (a photo can spoof it); production needs an IR/3D
  sensor or a liveness challenge.
- **Subscriptions and accountant export** are not built yet; the permit design supports
  recurring pulls as a next step. Refunds (full + partial) are implemented.
- **Webhooks** are best-effort fire-and-forget (no retry/signing yet).
- Testnet only; test WBT/USDT have no value.

---

## License

MIT
