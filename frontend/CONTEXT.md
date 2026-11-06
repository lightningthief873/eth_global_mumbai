# FacePay Frontend — Context

> Read root `../CONTEXT.md` first for the product + chain overview.

## Stack

- **Next.js 16.4.5** (App Router) — ⚠️ breaking changes vs older Next; read
  `node_modules/next/dist/docs/` before writing framework code (see `AGENTS.md`).
- **React 19.3**, **TypeScript 5**, **Tailwind CSS 4** (`@tailwindcss/turbopack`).
- Package manager: **bun** (`bun@1.3.14`). Use `bun install` / `bun run dev`.
- Chain SDK: **viem** + **wagmi** + **Reown AppKit** (to be added).

## Role

The frontend is the **merchant PoS terminal** and the **customer dashboard**. It does
not hold customer keys or do crypto signing — that is the backend's job. The terminal
captures a face image via the webcam and sends it to the backend; the backend does
recognition, signing, and sponsorship.

## Planned routes (App Router, under `app/`)

| Route | Purpose |
| --- | --- |
| `/` | Landing / product intro |
| `/merchant` | PoS terminal: enter amount → capture face → authorize → show receipt |
| `/user` | Customer dashboard: enrollment, wallet balance (WBT), PWSR rewards, history |
| `/enroll` | First-time face enrollment flow (capture + consent) |

## Chain configuration (Whitechain Sepolia)

Define a custom viem/wagmi chain (viem may not ship a `whitechainSepolia` entry; define
by hand and include the Multicall3 address so reads batch):

```ts
export const whitechainSepolia = defineChain({
  id: 1874,
  name: "Whitechain Sepolia",
  nativeCurrency: { name: "WBT", symbol: "WBT", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.whitechain.io"] } },
  blockExplorers: { default: { name: "Blockscout", url: "https://explorer.testnet.whitechain.io" } },
  contracts: { multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11", blockCreated: 0 } },
});
```

Only the **merchant** connects a real wallet (Reown AppKit) to receive WBT and read
balances. The **customer** is identified purely by face → backend-custodial wallet.

## Backend contract

- Base URL from `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`).
- Face capture: `getUserMedia` → canvas → JPEG/PNG blob → POST to backend.
- Key endpoints consumed (see `backend/CONTEXT.md` for the full list):
  - `POST /api/face/enroll`, `POST /api/face/recognize`, `GET /api/face/status/{address}`
  - `POST /api/wallet/create`, `POST /api/wallet/balance`
  - `POST /api/payment/charge` (merchant-sponsored WBT payment + PWSR reward)
  - `GET /api/payment/history/{address}`

## Env

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CHAIN_ID=1874
NEXT_PUBLIC_WC_RPC=https://rpc.testnet.whitechain.io
NEXT_PUBLIC_REOWN_PROJECT_ID=...   # Reown AppKit project id (merchant connect)
```

## Conventions

- Keep raw face images in-memory; never persist to localStorage or send anywhere but
  the backend over HTTPS.
- Reuse the existing scaffold (`app/layout.tsx`, `app/globals.css`); don't add a second
  styling convention — stay on Tailwind 4.

See `../plans/03-frontend.md` for the build plan.
