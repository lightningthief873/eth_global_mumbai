export interface ReceiptView {
  asset: "WBT" | "USDT";
  amountDisplay: string;       // formatted primary amount
  reward?: { label: string; amount: string } | null;  // e.g. PWSR for WBT
  customer: string;
  merchant: string;
  tx_hash: string;
  explorer_url: string;
}

interface Props {
  receipt: ReceiptView;
  onReset?: () => void;
}

function CheckMark() {
  return (
    <span
      className="flex items-center justify-center shrink-0"
      style={{
        width: "2.4rem",
        height: "2.4rem",
        borderRadius: "999px",
        background: "color-mix(in srgb, var(--fp-accent) 16%, transparent)",
        border: "1.5px solid var(--fp-accent)",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M5 13l4 4L19 7" stroke="var(--fp-accent)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export default function TxReceipt({ receipt, onReset }: Props) {
  return (
    <div className="fp-card flex flex-col gap-5 fp-rise">
      {/* Header */}
      <div className="flex items-center gap-3">
        <CheckMark />
        <div>
          <p className="fp-display" style={{ fontSize: "1.3rem" }}>Payment confirmed</p>
          <p className="fp-mono" style={{ fontSize: "0.72rem", marginTop: "0.15rem" }}>SETTLED ON WHITECHAIN</p>
        </div>
      </div>

      {/* Amounts */}
      <div className="grid gap-3" style={{ gridTemplateColumns: receipt.reward ? "1fr 1fr" : "1fr" }}>
        <div className="fp-panel" style={{ padding: "1rem" }}>
          <p className="fp-label" style={{ marginBottom: "0.45rem" }}>{receipt.asset} paid</p>
          <p className="fp-display" style={{ fontSize: "1.5rem", lineHeight: 1 }}>{receipt.amountDisplay}</p>
          <p className="fp-mono" style={{ fontSize: "0.66rem", marginTop: "0.35rem" }}>{receipt.asset}</p>
        </div>
        {receipt.reward && (
          <div className="fp-panel" style={{ padding: "1rem" }}>
            <p className="fp-label" style={{ marginBottom: "0.45rem", color: "var(--fp-accent-dim)" }}>{receipt.reward.label} earned</p>
            <p className="fp-display" style={{ fontSize: "1.5rem", lineHeight: 1, color: "var(--fp-accent)" }}>
              +{receipt.reward.amount}
            </p>
            <p className="fp-mono" style={{ fontSize: "0.66rem", marginTop: "0.35rem" }}>{receipt.reward.label}</p>
          </div>
        )}
      </div>

      {/* Addresses */}
      <div className="flex flex-col gap-3">
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
        className="fp-panel flex items-center justify-between"
        style={{ padding: "0.75rem 0.95rem", textDecoration: "none" }}
      >
        <span className="fp-mono" style={{ fontSize: "0.74rem" }}>
          {receipt.tx_hash.slice(0, 20)}…{receipt.tx_hash.slice(-8)}
        </span>
        <span className="fp-link" style={{ fontSize: "0.8rem", fontWeight: 600 }}>View ↗</span>
      </a>

      {onReset && (
        <button className="fp-btn fp-btn-ghost" onClick={onReset}>
          New payment
        </button>
      )}
    </div>
  );
}
