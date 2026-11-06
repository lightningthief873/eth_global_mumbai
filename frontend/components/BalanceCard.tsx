import type { BalanceResponse } from "@/lib/api";
import { addressUrl } from "@/lib/chain";

interface Props {
  balance: BalanceResponse;
}

export default function BalanceCard({ balance }: Props) {
  return (
    <div className="fp-card flex flex-col gap-4">
      {/* Address */}
      <div>
        <span className="fp-label">Wallet address</span>
        <a
          href={addressUrl(balance.address)}
          target="_blank"
          rel="noopener noreferrer"
          className="fp-mono"
          style={{ color: "var(--fp-accent)", textDecoration: "none" }}
        >
          {balance.address}
        </a>
      </div>

      {/* Balances */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <div
          style={{
            background: "var(--fp-surface-2)",
            borderRadius: "10px",
            padding: "1rem",
            border: "1px solid var(--fp-border)",
          }}
        >
          <p style={{ color: "var(--fp-muted)", fontSize: "0.75rem", marginBottom: "0.4rem" }}>WBT Balance</p>
          <p style={{ fontWeight: 700, fontSize: "1.4rem" }}>{Number(balance.wbt).toFixed(4)}</p>
          <p style={{ color: "var(--fp-muted)", fontSize: "0.72rem" }}>WBT · Whitechain</p>
        </div>
        <div
          style={{
            background: "color-mix(in srgb, var(--fp-accent) 8%, var(--fp-surface-2))",
            borderRadius: "10px",
            padding: "1rem",
            border: "1px solid color-mix(in srgb, var(--fp-accent) 25%, var(--fp-border))",
          }}
        >
          <p style={{ color: "var(--fp-muted)", fontSize: "0.75rem", marginBottom: "0.4rem" }}>PWSR Rewards</p>
          <p style={{ fontWeight: 700, fontSize: "1.4rem", color: "var(--fp-accent)" }}>
            {Number(balance.pwsr).toFixed(2)}
          </p>
          <p style={{ color: "var(--fp-muted)", fontSize: "0.72rem" }}>PWSR · loyalty token</p>
        </div>
      </div>
    </div>
  );
}
