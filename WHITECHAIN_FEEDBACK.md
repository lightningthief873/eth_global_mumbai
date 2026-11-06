# Whitechain feedback

Honest notes from building a USDT checkout flow on Whitechain Sepolia during the hackathon.

## What worked well

- **EVM parity was real.** Foundry + OpenZeppelin + `web3.py` + `viem` all worked with
  zero Whitechain-specific shims. Deploying and Blockscout-verifying three contracts took
  minutes; `forge verify-contract --verifier blockscout --verifier-url …/api/` worked first try.
- **~1s blocks + low fees** made the UX we wanted (gasless, relayer-sponsored, invoice
  settles while the customer watches) actually feel instant, and cheap enough for $2 payments.
- **The official USDT supports EIP-2612 `permit`.** That let us do a one-transaction,
  gasless-for-the-payer settlement (`permit` + `transferFrom`) via a relayer — exactly the
  pattern the track's ideas hinted at. We verified the permit domain by reconstructing
  `DOMAIN_SEPARATOR` (`name="Tether USD"`, `version="1"`, `chainId=1874`).
- **Public RPC + GitHub faucet** had no API-key friction; the Multicall3 predeploy at the
  canonical address meant our chain config needed no special casing.

## Where we got stuck

- **Getting test USDT was the main blocker.** The faucet only drips WBT; the USDT at
  `0xcedf…55a7` is an owner-minted Tether proxy with no public faucet. We only learned to
  swap WBT→USDT on YetiTrade from a side channel, not the docs. A line in the faucet/docs
  ("need test USDT? swap on YetiTrade" with the address + decimals) would have saved an hour.
- **Solc/EVM target vs. OpenZeppelin.** Latest OZ emits the `clz` opcode (Osaka/EIP-7939),
  which isn't on Sepolia's `prague`, so `forge build` failed cryptically. We pinned OZ to
  v5.1.0 and `solc 0.8.30`. Docs note `prague` is the ceiling, but an explicit "pin OZ ≤
  v5.1.x / avoid Osaka opcodes until Karst" note would have shortcut the debugging.
- **USDT is behind an EIP-1967 proxy**, so the explorer's "read methods" lived on the
  implementation (`TetherTokenV2`), not the proxy address — minor confusion when checking
  `permit`/`nonces`.

## What the docs were missing

- A canonical "test tokens" page: the USDT address, decimals (6), permit support, and the
  exact way to obtain it (YetiTrade swap). The prize page has the address; the docs don't.
- A short EVM-compatibility note on supported opcodes/solc (prague ceiling, no Osaka `clz`)
  aimed at people pulling in recent libraries.
- An example of relayer-sponsored `permit` settlement against the test USDT — it's the
  obvious pattern for these tracks and we had to derive the domain ourselves.

Overall: once we had USDT in a wallet, everything else was standard EVM and went smoothly.
The 1s finality + cheap gas + permit-ready USDT is a genuinely good fit for stablecoin
checkout.
