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
| Face engine | InsightFace / open-source (mock in dev) |
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
uv run backend                # uvicorn on :8000
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

### 5. Seed demo data (optional)

```bash
cd backend
uv run python scripts/seed_demo.py   # enroll sample faces + fund wallets
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
| `FACE_MATCH_THRESHOLD` | Cosine distance cutoff (default `0.35`) |
| `GAS_BUFFER_WBT` | WBT topped up per new wallet (default `0.01`) |

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

| Contract | Description |
| --- | --- |
| `PWSRToken` | ERC-20 reward token; minted by `PaymentProcessor` on every payment |
| `BiometricRegistry` | On-chain enrollment record + fresh-nonce / TTL access policy |
| `PaymentProcessor` | Receives WBT, forwards to merchant, mints PWSR reward |
| `ICrossChainRewards` | Interface stub for future cross-chain PWSR bridging |

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

## Known Limitations

- **Face recognition is mocked in dev** — hash-based embeddings, not real biometric matching. Replace `face_service.py` with InsightFace for production.
- **No liveness / anti-spoofing** — a photo can spoof the terminal. Production requires a 3D/IR sensor or liveness challenge.
- **Custodial model** — the backend holds customer private keys. This is a hackathon tradeoff; production should migrate to embedded non-custodial wallets or ERC-4337 smart accounts.
- **WBT only** — ERC-20 stablecoin support (USDC/USDT) is not in MVP.
- **Cross-chain rewards** — `ICrossChainRewards` interface is wired but not implemented; PWSR stays on Whitechain.

---

## License

MIT
