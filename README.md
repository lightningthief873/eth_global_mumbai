<div align="center">

# 💳 FacePay

### Stripe-style USDT checkout for Whitechain — pay with your **face**, settle on-chain, refund in one click.

A merchant drops FacePay into their store in **~20 lines**. The customer pays an invoice in
**USDT on Whitechain** by looking at a camera — no wallet popup, no gas, no seed phrase.
The merchant watches it settle and refunds with one click. Every payment is an on-chain,
invoice-bound receipt both sides can verify.

[![Whitechain](https://img.shields.io/badge/Whitechain-Sepolia_1874-5b7cfa)](https://whitechain.io)
[![Settles in USDT](https://img.shields.io/badge/Settles_in-USDT-26A17B)](https://explorer.testnet.whitechain.io/address/0xcedfB56113143d55b2358b8CFbB0dEB5Ad2f55a7)
[![PaymentHub verified](https://img.shields.io/badge/PaymentHub-verified-22c55e)](https://explorer.testnet.whitechain.io/address/0x8E95c4D0915D5d90D5633b4a245470b462147657)
[![Gasless](https://img.shields.io/badge/Payer_gas-%240.00-f59e0b)](#how-the-payer-pays-no-gas)

**Track:** 💳 Operate · Stablecoin Payments for Business
· **Live tx:** [1 USDT settlement ↗](https://explorer.testnet.whitechain.io/tx/0x200f32af5efebfd9f8a155b4078576b2be30a9020822aa610e52cbb7266f2e57)
· **Demo video:** _add link_

</div>

---

## 🎬 60-second judge path

```
backend:  cd backend  && uv sync && uv run main.py      # :8000
frontend: cd frontend && bun install && bun run dev     # :3000
```

1. **`/enroll`** — a customer enrolls their face → gets a wallet seeded with test USDT.
2. **`/dashboard`** — create a merchant, grab the API key, create a payment link.
3. **`/pay/<id>`** — open the link → **Pay with your face** → settles in USDT, receipt links to the explorer.
4. **`/dashboard`** — hit **Refund** (full or partial) → settles on-chain.

Prefer the integration story? Open **`demo-store/`** — a separate shop that adds FacePay in ~20 lines, creates a real invoice, and redirects to checkout.

---

## ✅ Bounty qualification — at a glance

| # | Requirement | Where it's met |
| - | --- | --- |
| 1 | Contracts on Whitechain Sepolia (1874), **verified** | `PaymentHub` [`0x8E95…7657`](https://explorer.testnet.whitechain.io/address/0x8E95c4D0915D5d90D5633b4a245470b462147657) ✔ verified |
| 2 | ≥1 **USDT** payment settled in the main flow + explorer link | [`0x200f32…f2e57`](https://explorer.testnet.whitechain.io/tx/0x200f32af5efebfd9f8a155b4078576b2be30a9020822aa610e52cbb7266f2e57) — 1 USDT via `PaymentHub` (official Tether, not self-minted) |
| 3 | README line on **why on-chain stablecoin on Whitechain** | [see below](#-why-this-needs-on-chain-stablecoin-on-whitechain) |
| 4 | Public repo, steady commits, setup + architecture + limits | granular commit history · [setup](#-setup--run) · [architecture](#-architecture) · [limitations](#-honest-limitations) |
| 5 | Demo video (2–4 min), each party shown | _add link_ (script = the [judge path](#-60-second-judge-path)) |
| 6 | `WHITECHAIN_FEEDBACK.md` | [`WHITECHAIN_FEEDBACK.md`](./WHITECHAIN_FEEDBACK.md) |

**Beyond the first payment (extra credit):** one-click **full & partial refunds**, settled
on-chain — [`0x9c7bc5…0cc9c0`](https://explorer.testnet.whitechain.io/tx/0x9c7bc55f5fa7a119fd1f2a5ba15b710cb4e0baf611e0b0ea0abc1cfd580cc9c0).

**Not** a plain-transfer pay button: every payment is **invoice-bound, stateful, permit-based, and refundable** through `PaymentHub`.

---

## ⭐ What makes it stand out

- **Pay with your face.** Returning customers authorise a USDT payment with a glance — the
  face match releases an EIP-2612 permit. No wallet UI, no popup, no chain awareness.
- **Zero gas for the payer.** The customer signs a `permit` off-chain; a relayer submits
  the transaction and pays WBT gas. A $2 coffee works.
- **A real integration surface, not a toy.** A drop-in SDK + payment-link API + hosted
  checkout + webhooks + merchant dashboard. The `demo-store/` proves ~20-line adoption.
- **Verifiable money movement.** Each invoice emits `InvoicePaid` / `InvoiceRefunded`; the
  customer can confirm payment *and* refund independently on Blockscout.

---

## 💵 Why this needs on-chain stablecoin on Whitechain

A card rail or PayPal can't do what this flow needs: **instant, final, cross-border
settlement in a dollar-stable unit, with no chargebacks and a public receipt both parties
can verify.** On Whitechain the payment clears in **~1s** to a stablecoin the merchant
holds immediately — no 2–3 day payout, no 2.9%+ fees, no interchange, no acquiring bank,
and it works for a contractor billing a client across borders. The **refund rides the same
rail**: one on-chain transaction the customer can check, instead of an opaque reversal that
takes a week. Settling in **USDT** (not a local-currency token or a self-issued coin) means
the merchant is paid in real dollars, and Whitechain's **low-fee L2** makes
relayer-sponsored, gasless-for-the-payer checkout economical down to coffee-sized amounts.

---

## 🔌 Drop-in integration (the ~20 lines)

```js
import { FacePayCheckout } from "facepay-checkout";

const fp = new FacePayCheckout({ apiKey: "sk_live_…" });   // from the dashboard

// When the customer clicks "Checkout":
const invoice = await fp.createInvoice({
  amountUSDT: "2.00",
  description: "Single Origin Latte",
  orderId: "order-1042",
});
window.location.href = fp.checkoutUrl(invoice.id);          // hosted USDT checkout

// Your webhook receives { event: "invoice.paid", invoice } with the on-chain tx hash.
```

Complete working example: [`demo-store/store.js`](./demo-store/store.js) — a separate shop that does exactly this.

---

## 🧾 Live on-chain proof (Whitechain Sepolia)

Real payments in the **official USDT** (`0xcedfB56113143d55b2358b8CFbB0dEB5Ad2f55a7`), settled through `PaymentHub`:

| Action | Amount | Explorer |
| --- | --- | --- |
| Invoice paid in USDT (`PaymentHub`) | 1.00 USDT | [`0x200f32…f2e57`](https://explorer.testnet.whitechain.io/tx/0x200f32af5efebfd9f8a155b4078576b2be30a9020822aa610e52cbb7266f2e57) |
| Invoice paid **by face** | 2.00 USDT | [`0x86e215…c2fb2`](https://explorer.testnet.whitechain.io/tx/0x86e215e720ec541c1885bebc05690ddbe88029f786d49279add531791e7c2fb2) |
| One-click partial refund | 0.50 USDT | [`0x9c7bc5…0cc9c0`](https://explorer.testnet.whitechain.io/tx/0x9c7bc55f5fa7a119fd1f2a5ba15b710cb4e0baf611e0b0ea0abc1cfd580cc9c0) |

`PaymentHub`: [`0x8E95c4D0915D5d90D5633b4a245470b462147657`](https://explorer.testnet.whitechain.io/address/0x8E95c4D0915D5d90D5633b4a245470b462147657) (verified on Blockscout).

---

## 🏗 Architecture

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
                                   ┌────────────────────────────┐
                                   │ PaymentHub   invoice + refund│
                                   │ USDT (Tether) transferFrom   │  payer → merchant
                                   └────────────────────────────┘
                                   emits InvoicePaid / InvoiceRefunded  = on-chain receipt
```

### How the payer pays no gas

The payer signs an EIP-2612 `permit` **off-chain** (no WBT needed); the relayer submits
`PaymentHub.payWithPermit` and covers gas in WBT. For returning customers the backend holds
a custodial key, so a **face match authorises the permit** — the customer does nothing but
look at the camera.

---

## 📁 Repo layout

```
contracts/      Foundry — PaymentHub (USDT invoices + refunds), tests, deploy
sdk/            Framework-agnostic FacePayCheckout SDK (facepay-checkout.js)
demo-store/     A SEPARATE toy store that integrates the SDK in ~20 lines
backend/        FastAPI — invoices, USDT settlement, refunds, face recognition
frontend/       Next.js — /dashboard (merchant) and /pay/[id] (customer checkout)
```

---

## 🛠 Setup & run

### Prerequisites
- Python 3.13 + [uv](https://docs.astral.sh/uv/), Node 20+ + [bun](https://bun.sh), [Foundry](https://book.getfoundry.sh)
- A relayer wallet funded with test **WBT** (gas) and test **USDT**. Get WBT from the
  [faucet](https://faucet.testnet.whitechain.io), swap some for USDT on
  [YetiTrade](https://testnet.yetitrade.fi). See [Relayer wallet](#-relayer-wallet).

### 1. Contracts (already deployed — redeploy only for your own)
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
uv sync && uv run main.py            # http://localhost:8000  (API docs at /docs)
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

---

## 📇 Contracts

| Contract | Address (Whitechain Sepolia) | Role |
| --- | --- | --- |
| `PaymentHub` | [`0x8E95c4D0915D5d90D5633b4a245470b462147657`](https://explorer.testnet.whitechain.io/address/0x8E95c4D0915D5d90D5633b4a245470b462147657) | Invoice-bound USDT settlement + full/partial refunds |
| USDT (Tether, official) | [`0xcedfB56113143d55b2358b8CFbB0dEB5Ad2f55a7`](https://explorer.testnet.whitechain.io/address/0xcedfB56113143d55b2358b8CFbB0dEB5Ad2f55a7) | Settlement asset (6 decimals, EIP-2612 permit) |
| `BiometricRegistry` | [`0x6E64d396F09550278c75839A2E4bc0A2848e3eB0`](https://explorer.testnet.whitechain.io/address/0x6E64d396F09550278c75839A2E4bc0A2848e3eB0) | Face-enrollment record (express path) |

Solidity `0.8.30`, `evm_version = prague`, OpenZeppelin v5.1.0. **7 `PaymentHub` tests**
(`forge test`) cover pay, permit, and full/partial refunds.

---

## 🔗 API reference

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/merchants` | Onboard a merchant → `{ api_key, address }` |
| `POST` | `/api/invoices` | Create an invoice / payment link (needs `X-API-Key`) |
| `GET`  | `/api/invoices/{id}` | Public invoice status (checkout + polling) |
| `GET`  | `/api/merchants/invoices` | List a merchant's invoices (needs `X-API-Key`) |
| `POST` | `/api/invoices/{id}/pay` | Pay in USDT — multipart `image` (face) or `payer_address` |
| `POST` | `/api/invoices/{id}/refund` | Full/partial refund (needs `X-API-Key`) |

---

## 🪙 Relayer wallet

Sponsors gas, seeds demo wallets, and submits permit-based payments. Keep it funded with WBT (gas) and USDT (demo balances).

| | |
| --- | --- |
| Address | [`0x302478941faCdb2c9Dbb412B60e35354F0AF0027`](https://explorer.testnet.whitechain.io/address/0x302478941faCdb2c9Dbb412B60e35354F0AF0027) |
| WBT | [faucet.testnet.whitechain.io](https://faucet.testnet.whitechain.io) |
| USDT | swap WBT→USDT on [testnet.yetitrade.fi](https://testnet.yetitrade.fi) |

Public address only; the private key lives in `backend/.env` (git-ignored).

---

## License

MIT
