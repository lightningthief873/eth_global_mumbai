# FacePay

> Face-biometric payment protocol and point-of-sale terminal on **Whitechain**.

[![Whitechain](https://img.shields.io/badge/Whitechain-L2-blue)](https://whitechain.io)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![Python](https://img.shields.io/badge/Python-3.13-green)](https://python.org)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## Overview

FacePay lets a customer enroll their face once and pay at any merchant terminal with nothing but their face — no card, no phone, no wallet app. The merchant terminal captures a face, the backend identifies the customer, signs a sponsored on-chain payment from their custodial wallet, and mints PWSR loyalty reward tokens — all in under two seconds.

---

## Why Whitechain

FacePay is a point-of-sale product: someone stands at a terminal and wants to pay in the
time it takes to tap a card. That single constraint drove the chain choice, and
Whitechain fit it better than a generic L1 or L2 for a hackathon build.

**Why it's the right chain for this product**

- **One-second confirmations.** Whitechain's ~1s block time means a face scan resolves to
  a settled payment while the customer is still looking at the camera. On most L1s a
  checkout would stall for 12s+; that kills the PoS experience.
- **Cheap, predictable fees.** As an OP Stack L2 (5 gwei floor), a coffee-sized micro-payment
  costs a fraction of a cent to settle. Our whole model — the relayer sponsoring gas for
  every customer — is only viable because fees are this low.
- **WBT as the native gas token.** Payment value *and* gas are the same asset. That let us
  keep the custodial + relayer model dead simple: fund a wallet once in WBT and it can both
  pay merchants and cover its own gas — no separate gas token to manage.
- **Merchant-first "Onchain Economy Layer."** Whitechain targets businesses transacting
  on-chain, which is exactly FacePay's audience: merchants accepting biometric payments.
- **Ethereum settlement.** Payments finalize to Ethereum, so merchants get L1-grade
  security without L1 latency or cost.

**Why it was fast to build on (hackathon reality)**

- **Full EVM compatibility (Prague).** We reused the mature Ethereum toolchain end to end —
  Foundry + OpenZeppelin for contracts, `web3.py` on the backend, `viem` on the frontend —
  instead of learning a bespoke VM. Three contracts went from zero to deployed-and-verified
  in one sitting.
- **Public RPC + faucet, no gatekeeping.** `rpc.testnet.whitechain.io` needs no API key, and
  the faucet funded our relayer instantly — zero setup friction during a time-boxed build.
- **Blockscout verification.** Every contract is source-verified, so judges can read the code
  and trace each payment's `Paid` event directly on the explorer. Every receipt in the app
  links straight to the on-chain transaction.
- **Standard predeploys.** Multicall3 at the canonical address let the frontend batch reads
  against the rate-limited public RPC with no extra infra.

**How we used it concretely**

- Deployed `PWSRToken`, `BiometricRegistry`, and `PaymentProcessor` (Solidity 0.8.30,
  `evm_version = prague`) to **Whitechain Sepolia (chain ID 1874)**, verified on Blockscout.
- Every payment is a real `PaymentProcessor.charge{value}` transaction: native **WBT** moves
  customer → merchant and **PWSR** rewards are minted in the same call.
- The backend signs with `web3.py` using **EIP-1559 fees that respect the 5 gwei base-fee
  floor**, and a relayer EOA (funded in WBT) sponsors gas for every custodial wallet.

---

## Features

- **Face Enrollment** — capture once, pay anywhere; biometric embedding AES-GCM encrypted at rest.
- **Custodial EVM Wallets** — per-customer keypairs held by the backend; face auth = authorization to sign.
- **WBT Payments** — native Whitechain gas token; customer wallet → merchant, on-chain, every time.
- **PWSR Rewards** — ERC-20 loyalty token minted per payment; accrues in the customer wallet.
- **Gas Sponsorship** — relayer keeps customer wallets topped up; customers never touch gas.
- **On-chain Policy** — `BiometricRegistry` stores commitment hashes + fresh-nonce/TTL access control.
- **Merchant PoS Terminal** — full-screen webcam capture UI; instant receipt with explorer link.

---

## Architecture

```
Customer face
      │
      ▼ (webcam, JPEG)
Merchant Terminal (Next.js)
      │  POST /api/face/enroll or /api/payment/charge
      ▼
Backend API (FastAPI / Python)
  ├── Face Service        → AES-GCM encrypted embedding in DB
  ├── Wallet Service      → custodial EVM keypairs (eth-account)
  ├── Chain Service       → web3.py ↔ Whitechain Sepolia RPC
  └── Payment Service     → PaymentProcessor.charge{value: WBT}
                                    │
                                    ▼
                           Whitechain Sepolia
                        ┌──────────────────────┐
                        │  BiometricRegistry   │  commitment + nonce
                        │  PaymentProcessor    │  WBT → merchant
                        │  PWSRToken (ERC-20)  │  reward mint
                        └──────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Blockchain | Whitechain (EVM, OP Stack L2) · Chain ID 1874 (Sepolia) / 1875 (Mainnet) |
| Smart contracts | Solidity 0.8.30 · Foundry · Blockscout verify |
| Backend | Python 3.13 · FastAPI · SQLModel (SQLite/Postgres) |
| Chain client | web3.py · eth-account |
| Face engine | InsightFace ArcFace (`buffalo_l`, real 512-d embeddings) |
| Encryption | AES-GCM (cryptography library) |
| Frontend | Next.js 16 · React 19 · Tailwind CSS 4 · TypeScript |
| Package manager | uv (backend) · bun (frontend) |

---

## Getting Started

### Prerequisites

- Python 3.13 + [uv](https://docs.astral.sh/uv/)
- Node.js 20+ + [bun](https://bun.sh)
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (for contracts)
- A funded Whitechain Sepolia wallet — claim test WBT at [faucet.testnet.whitechain.io](https://faucet.testnet.whitechain.io)

---

### 1. Clone

```bash
git clone https://github.com/lightningthief873/eth_global_mumbai.git
cd eth_global_mumbai
```

---

### 2. Deploy contracts

> **Contracts are already deployed and verified on Whitechain Sepolia** (addresses in [Smart Contracts](#smart-contracts)). Reuse them via the backend `.env`, or redeploy your own with the steps below.

```bash
cd contracts
cp .env.example .env          # fill PRIVATE_KEY
forge install
forge test
forge script script/Deploy.s.sol \
  --rpc-url https://rpc.testnet.whitechain.io \
  --private-key $PRIVATE_KEY --broadcast \
  --verify --verifier blockscout \
  --verifier-url https://explorer.testnet.whitechain.io/api/
```

Addresses are written to `contracts/deployments/sepolia.json`. Copy them into the backend `.env`.

---

### 3. Backend

```bash
cd backend
cp .env.example .env          # fill all vars (see Environment below)
uv sync
uv run main.py                # uvicorn on :8000
```

API docs at [http://localhost:8000/docs](http://localhost:8000/docs).

---

### 4. Frontend

```bash
cd frontend
cp .env.example .env.local    # fill NEXT_PUBLIC_API_URL etc.
bun install
bun run dev                   # Next.js on :3000
```

---

## Environment

### Backend (`backend/.env`)

| Variable | Description |
| --- | --- |
| `WC_RPC_URL` | `https://rpc.testnet.whitechain.io` |
| `WC_CHAIN_ID` | `1874` |
| `RELAYER_PRIVATE_KEY` | Funded EOA that sponsors gas and tops up customer wallets |
| `WALLET_ENCRYPTION_KEY` | 32-byte hex key for AES-GCM envelope encryption |
| `PWSR_TOKEN_ADDRESS` | Deployed `PWSRToken` address |
| `BIOMETRIC_REGISTRY_ADDRESS` | Deployed `BiometricRegistry` address |
| `PAYMENT_PROCESSOR_ADDRESS` | Deployed `PaymentProcessor` address |
| `DATABASE_URL` | `sqlite:///./facepay.db` (dev) or Postgres URL |
| `FACE_MATCH_THRESHOLD` | ArcFace cosine-distance cutoff (default `0.8`) |
| `GAS_BUFFER_WBT` | WBT topped up per new wallet on enroll (default `0.05`) |
| `CORS_ORIGIN` | Allowed frontend origin (default `http://localhost:3000`) |

### Frontend (`frontend/.env.local`)

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` |
| `NEXT_PUBLIC_CHAIN_ID` | `1874` |
| `NEXT_PUBLIC_EXPLORER_URL` | `https://explorer.testnet.whitechain.io` |

---

## API Reference

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/wallet/create` | Create a new custodial EVM wallet |
| `POST` | `/api/wallet/balance` | WBT + PWSR balances for an address |
| `POST` | `/api/face/enroll` | Enroll a face; creates wallet if needed |
| `POST` | `/api/face/recognize` | Identify a face → address + confidence |
| `GET`  | `/api/face/status/{address}` | Enrollment status |
| `POST` | `/api/payment/charge` | Face-auth payment: WBT to merchant + PWSR reward |
| `GET`  | `/api/payment/history/{address}` | Payment history for an address |
| `POST` | `/api/policy/nonce` | Issue a fresh authorization nonce |

---

## Smart Contracts

| Contract | Address (Whitechain Sepolia) | Description |
| --- | --- | --- |
| `PWSRToken` | [`0xE5C32424F213F8727057e936Fa0381675161947C`](https://explorer.testnet.whitechain.io/address/0xE5C32424F213F8727057e936Fa0381675161947C) | ERC-20 reward token; minted by `PaymentProcessor` on every payment |
| `BiometricRegistry` | [`0x6E64d396F09550278c75839A2E4bc0A2848e3eB0`](https://explorer.testnet.whitechain.io/address/0x6E64d396F09550278c75839A2E4bc0A2848e3eB0) | On-chain enrollment record + fresh-nonce / TTL access policy |
| `PaymentProcessor` | [`0x8254525bFD51B0f13B5CE171DEbe11b6b70d34FE`](https://explorer.testnet.whitechain.io/address/0x8254525bFD51B0f13B5CE171DEbe11b6b70d34FE) | Receives WBT, forwards to merchant, mints PWSR reward |
| `ICrossChainRewards` | — (interface) | Stub for future cross-chain PWSR bridging |

All contracts target Solidity `0.8.30`, EVM version `prague`. Verified on [Blockscout](https://explorer.testnet.whitechain.io).

---

## Network

| | Whitechain Sepolia | Whitechain Mainnet |
| --- | --- | --- |
| Chain ID | `1874` | `1875` |
| RPC | `https://rpc.testnet.whitechain.io` | `https://rpc.whitechain.io` |
| Explorer | [explorer.testnet.whitechain.io](https://explorer.testnet.whitechain.io) | [explorer.whitechain.io](https://explorer.whitechain.io) |
| Faucet | [faucet.testnet.whitechain.io](https://faucet.testnet.whitechain.io) | — |


---

## Relayer wallet (fund this)

The relayer is the sponsor EOA that pays gas, tops up each new custodial wallet, and
writes enrollment commitments on-chain. Keep it funded with test WBT or enrollments and
payments will fail.

| | |
| --- | --- |
| Address | [`0x302478941faCdb2c9Dbb412B60e35354F0AF0027`](https://explorer.testnet.whitechain.io/address/0x302478941faCdb2c9Dbb412B60e35354F0AF0027) |
| Fund at | [faucet.testnet.whitechain.io](https://faucet.testnet.whitechain.io) |
| Cost per enrollment | ~0.05 WBT (gas buffer funded into the new custodial wallet) |

> Public address only — the private key lives solely in `backend/.env` (git-ignored) and is never committed.
---

## Known Limitations

- **Face recognition** — real ArcFace (InsightFace `buffalo_l`) embeddings with cosine-distance matching. First run downloads the ~280MB model to `~/.insightface`.
- **No liveness / anti-spoofing** — a photo can spoof the terminal. Production requires a 3D/IR sensor or liveness challenge.
- **Custodial model** — the backend holds customer private keys. This is a hackathon tradeoff; production should migrate to embedded non-custodial wallets or ERC-4337 smart accounts.
- **WBT only** — ERC-20 stablecoin support (USDC/USDT) is not in MVP.
- **Cross-chain rewards** — `ICrossChainRewards` interface is wired but not implemented; PWSR stays on Whitechain.

---

## License

MIT
