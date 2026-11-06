import { defineChain } from "viem";

export const whitechainSepolia = defineChain({
  id: 1874,
  name: "Whitechain Sepolia",
  nativeCurrency: { name: "WBT", symbol: "WBT", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_WC_RPC ?? "https://rpc.testnet.whitechain.io",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url:
        process.env.NEXT_PUBLIC_EXPLORER_URL ??
        "https://explorer.testnet.whitechain.io",
    },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 0,
    },
  },
  testnet: true,
});

export const EXPLORER_URL =
  process.env.NEXT_PUBLIC_EXPLORER_URL ??
  "https://explorer.testnet.whitechain.io";

export function txUrl(hash: string) {
  return `${EXPLORER_URL}/tx/${hash}`;
}

export function addressUrl(addr: string) {
  return `${EXPLORER_URL}/address/${addr}`;
}
