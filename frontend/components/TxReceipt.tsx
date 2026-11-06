import type { ChargeResponse } from "@/lib/api";

interface Props {
  receipt: ChargeResponse;
  onReset?: () => void;
}


export default function TxReceipt({ receipt, onReset }: Props) {
  return (
    <div className="fp-card flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span style={{ fontSize: "1.5rem" }}>✅</span>
        <div>
          <p style={{ fontWeight: 700, fontSize: "1rem" }}>Payment confirmed</p>
          <p style={{ color: "var(--fp-muted)", fontSize: "0.8rem" }}>Transaction recorded on Whitechain</p>
        </div>
      </div>

      {/* Amounts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.75rem",
        }}
      >
        <div style={{ background: "var(--fp-surface-2)", borderRadius: "8px", padding: "0.75rem" }}>
          <p style={{ color: "var(--fp-muted)", fontSize: "0.75rem", marginBottom: "0.25rem" }}>WBT paid</p>
          <p style={{ fontWeight: 700, fontSize: "1.1rem" }}>{(Number(BigInt(receipt.amount_wei)) / 1e18).toFixed(6)}</p>
          <p style={{ color: "var(--fp-muted)", fontSize: "0.72rem" }}>WBT</p>
        </div>
        <div style={{ background: "var(--fp-surface-2)", borderRadius: "8px", padding: "0.75rem" }}>
          <p style={{ color: "var(--fp-muted)", fontSize: "0.75rem", marginBottom: "0.25rem" }}>PWSR earned</p>
          <p style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--fp-accent)" }}>
            {(Number(BigInt(receipt.pwsr_wei)) / 1e18).toFixed(6)}
          </p>
          <p style={{ color: "var(--fp-muted)", fontSize: "0.72rem" }}>PWSR</p>
        </div>
      </div>

      {/* Addresses */}
      <div className="flex flex-col gap-1">
        <div>
          <span className="fp-label">Customer</span>
          <p className="fp-mono">{receipt.customer}</p>
        </div>
        <div>
          <span className="fp-label">Merchant</span>
          <p className="fp-mono">{receipt.merchant}</p>
        </div>
      </div>

      {/* Tx link */}
      <a
        href={receipt.explorer_url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--fp-surface-2)",
          borderRadius: "8px",
          padding: "0.65rem 0.875rem",
          textDecoration: "none",
          border: "1px solid var(--fp-border)",
        }}
      >
        <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.75rem", color: "var(--fp-muted)" }}>
          {receipt.tx_hash.slice(0, 18)}…{receipt.tx_hash.slice(-8)}
        </span>
        <span style={{ color: "var(--fp-accent)", fontSize: "0.8rem" }}>View ↗</span>
      </a>

      {onReset && (
        <button className="fp-btn fp-btn-ghost" onClick={onReset}>
          New payment
        </button>
      )}
    </div>
  );
}
