import type { BalanceResponse } from "@/lib/api";
import { addressUrl } from "@/lib/chain";

interface Props {
  balance: BalanceResponse;
}

export default function BalanceCard({ balance }: Props) {
  return (
    <div className="fp-card flex flex-col gap-5">
      {/* Address */}
      <div>
        <span className="fp-label">Custodial wallet</span>
        <a
          href={addressUrl(balance.address)}
          target="_blank"
          rel="noopener noreferrer"
          className="fp-mono fp-link"
        >
          {balance.address}
        </a>
      </div>

      {/* Balances */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="fp-panel" style={{ padding: "1.1rem" }}>
          <p className="fp-label" style={{ marginBottom: "0.6rem" }}>WBT balance</p>
          <p className="fp-display" style={{ fontSize: "2rem", lineHeight: 1 }}>{Number(balance.wbt).toFixed(4)}</p>
          <p className="fp-mono" style={{ fontSize: "0.68rem", marginTop: "0.4rem" }}>WBT · WHITECHAIN</p>
        </div>
        <div
          className="fp-panel"
          style={{
            padding: "1.1rem",
            background: "color-mix(in srgb, var(--fp-accent) 7%, var(--fp-surface-2))",
            borderColor: "color-mix(in srgb, var(--fp-accent) 28%, var(--fp-border))",
          }}
        >
          <p className="fp-label" style={{ marginBottom: "0.6rem", color: "var(--fp-accent-dim)" }}>PWSR rewards</p>
          <p className="fp-display" style={{ fontSize: "2rem", lineHeight: 1, color: "var(--fp-accent)" }}>
            {Number(balance.pwsr).toFixed(2)}
          </p>
          <p className="fp-mono" style={{ fontSize: "0.68rem", marginTop: "0.4rem" }}>PWSR · LOYALTY</p>
        </div>
      </div>
    </div>
  );
}
