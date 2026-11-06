# FacePay Backend — Context

> Read root `../CONTEXT.md` first for the product + chain overview.

## Stack

- **Python 3.13**, managed with **uv** (`pyproject.toml`, `uv_build`).
- Current scaffold: `src/backend/__init__.py`, console script `backend = "backend:main"`.
- Planned framework: **FastAPI** + **uvicorn** (async HTTP API).
- Chain client: **web3.py** against the Whitechain Sepolia RPC.
- Keys/signing: **eth-account** (EIP-191/-1559), custodial keys encrypted at rest.
- Face engine: **open-source** — InsightFace (`insightface` + `onnxruntime`) preferred,
  `face_recognition`/`dlib` acceptable fallback. Produces a fixed-length embedding.
- DB: **SQLModel/SQLAlchemy**; SQLite for local dev, Postgres in prod.
- Crypto: **cryptography** (AES-GCM envelope encryption of templates).

## Responsibilities

The backend is the trust core. It:
1. Enrolls faces → computes an embedding → envelope-encrypts it → stores ciphertext +
   an on-chain commitment hash via `BiometricRegistry`.
2. Recognizes a face at the terminal → matches against enrolled embeddings.
3. Holds **custodial EVM keypairs** for customers (encrypted); a face match authorizes
   signing a payment on the customer's behalf.
4. Runs the **relayer EOA** that sponsors (pays gas for) customer transactions.
5. Executes payments via `PaymentProcessor` (WBT to merchant + PWSR reward mint).

## Planned module layout (`src/backend/`)

```
src/backend/
├── __init__.py
├── main.py                 # FastAPI app factory + console entrypoint
├── config.py               # env settings (pydantic-settings)
├── db.py                   # engine/session, create_all
├── models.py               # Customer, Wallet, Enrollment, Payment
├── api/
│   ├── face.py             # /api/face/*
│   ├── wallet.py           # /api/wallet/*
│   ├── payment.py          # /api/payment/*
│   └── policy.py           # /api/policy/* (nonce, encrypt/decrypt admin)
└── services/
    ├── face_service.py     # embedding + match (InsightFace)
    ├── crypto_service.py   # AES-GCM envelope encryption of templates
    ├── wallet_service.py   # custodial keypair create/load/decrypt (eth-account)
    ├── chain_service.py    # web3.py: RPC, nonce, EIP-1559 fees, send/sponsor
    ├── registry_service.py # BiometricRegistry reads/writes (enroll, nonce, TTL)
    ├── payment_service.py  # PaymentProcessor: charge WBT + mint PWSR
    └── crosschain_service.py # stub for ICrossChainRewards (deferred)
```

## API surface

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/wallet/create` | Create a custodial EVM wallet for a new customer |
| POST | `/api/wallet/balance` | WBT + PWSR balances for an address |
| POST | `/api/face/enroll` | Enroll a face: embed → encrypt → store → registry commit |
| POST | `/api/face/recognize` | Match a face image → return customer + address |
| GET  | `/api/face/status/{address}` | Whether an address is enrolled |
| POST | `/api/payment/charge` | Recognize (or by address) → sponsored WBT pay → PWSR mint |
| GET  | `/api/payment/history/{address}` | Past payments for a customer |
| POST | `/api/policy/nonce` | Issue a fresh nonce for a recognition/authorization |

## Chain details

- RPC: `https://rpc.testnet.whitechain.io` (chain id `1874`, WBT native, 18 dec).
- Use **EIP-1559** fees; respect the 5 gwei min base fee. Batch reads via Multicall3
  (`0xcA11bde05977b3631167028862bE2a173976CA11`). Handle `429` with `Retry-After` backoff.
- Contract ABIs/addresses come from the Foundry deploy output (`contracts/`); store
  addresses in env after deploy.

## Env

```
WC_RPC_URL=https://rpc.testnet.whitechain.io
WC_CHAIN_ID=1874
RELAYER_PRIVATE_KEY=0x...          # sponsor EOA, pays gas (throwaway testnet key)
WALLET_ENCRYPTION_KEY=...          # AES key for custodial key + template encryption
PWSR_TOKEN_ADDRESS=0x...
BIOMETRIC_REGISTRY_ADDRESS=0x...
PAYMENT_PROCESSOR_ADDRESS=0x...
DATABASE_URL=sqlite:///./facepay.db
FACE_MATCH_THRESHOLD=0.35          # cosine distance cutoff (tune per engine)
```

## Security notes

- Templates: AES-GCM envelope encryption; store ciphertext + nonce + commitment hash
  only. Raw images processed in-memory, never persisted.
- Custodial private keys encrypted with `WALLET_ENCRYPTION_KEY`; never logged.
- Recognition authorization is single-use: bind to a fresh registry nonce + TTL to
  prevent replay.

See `../plans/02-backend.md` for the build plan.
