"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import CameraCapture from "@/components/CameraCapture";
import BalanceCard from "@/components/BalanceCard";
import { face, wallet, payment } from "@/lib/api";
import type { BalanceResponse, PaymentRecord } from "@/lib/api";
import { addressUrl } from "@/lib/chain";

type IdentifyMode = "idle" | "face" | "address";

export default function UserPage() {
  const [mode, setMode] = useState<IdentifyMode>("idle");
  const [address, setAddress] = useState("");
  const [inputAddress, setInputAddress] = useState("");
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [history, setHistory] = useState<PaymentRecord[]>([]);
  const [enrolled, setEnrolled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboard(addr: string) {
    setLoading(true);
    setError(null);
    try {
      const [bal, hist, status] = await Promise.all([
        wallet.balance(addr),
        payment.history(addr),
        face.status(addr),
      ]);
      setBalance(bal);
      setHistory(hist);
      setEnrolled(status.enrolled);
      setAddress(addr);
      setMode("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function identifyByFace(blob: Blob) {
    setLoading(true);
    setError(null);
    try {
      const res = await face.recognize(blob);
      await loadDashboard(res.address);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  }

  function reset() {
    setAddress("");
    setBalance(null);
    setHistory([]);
    setEnrolled(null);
    setError(null);
    setMode("idle");
    setInputAddress("");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex flex-col items-center px-4 py-10 flex-1">
        <div style={{ width: "100%", maxWidth: "580px" }} className="flex flex-col gap-6">

          {/* Title */}
          <div>
            <h1 style={{ fontWeight: 800, fontSize: "1.75rem", letterSpacing: "-0.02em" }}>My dashboard</h1>
            <p style={{ color: "var(--fp-muted)", fontSize: "0.9rem", marginTop: "0.3rem" }}>
              Identify by face or enter your wallet address.
            </p>
          </div>

          {/* Identity selector — only when no address loaded */}
          {!address && mode === "idle" && (
            <div className="flex flex-col gap-3">
              <button className="fp-btn fp-btn-primary" style={{ width: "100%" }} onClick={() => setMode("face")}>
                👤 Identify by face
              </button>
              <button className="fp-btn fp-btn-ghost" style={{ width: "100%" }} onClick={() => setMode("address")}>
                🔑 Enter wallet address
              </button>
            </div>
          )}

          {/* Face identify */}
          {mode === "face" && (
            <div className="fp-card flex flex-col gap-4">
              <p style={{ fontWeight: 600 }}>Look at the camera</p>
              <CameraCapture label="Identify me" onCapture={(blob) => identifyByFace(blob)} />
              <button className="fp-btn fp-btn-ghost" onClick={() => setMode("idle")}>← Cancel</button>
            </div>
          )}

          {/* Address identify */}
          {mode === "address" && (
            <div className="fp-card flex flex-col gap-3">
              <p style={{ fontWeight: 600 }}>Enter wallet address</p>
              <input
                className="fp-input"
                placeholder="0x…"
                value={inputAddress}
                onChange={(e) => setInputAddress(e.target.value)}
              />
              <div className="flex gap-2">
                <button className="fp-btn fp-btn-ghost" style={{ flex: 1 }} onClick={() => setMode("idle")}>← Cancel</button>
                <button
                  className="fp-btn fp-btn-primary"
                  style={{ flex: 2 }}
                  disabled={!inputAddress.startsWith("0x") || inputAddress.length !== 42}
                  onClick={() => loadDashboard(inputAddress)}
                >
                  Load dashboard
                </button>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="fp-card flex items-center justify-center gap-3 py-8">
              <div style={{ width: "1.5rem", height: "1.5rem", border: "2px solid var(--fp-border)", borderTopColor: "var(--fp-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <span style={{ color: "var(--fp-muted)" }}>Loading…</span>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="fp-card" style={{ borderColor: "var(--fp-error)" }}>
              <p style={{ color: "var(--fp-error)", fontWeight: 600, marginBottom: "0.4rem" }}>Error</p>
              <p style={{ color: "var(--fp-muted)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>{error}</p>
              <button className="fp-btn fp-btn-ghost" onClick={reset}>Reset</button>
            </div>
          )}

          {/* Dashboard */}
          {address && balance && !loading && (
            <div className="flex flex-col gap-5">
              {/* Enrollment badge */}
              <div className="flex items-center justify-between">
                <span style={{ color: "var(--fp-muted)", fontSize: "0.82rem" }}>
                  <a href={addressUrl(address)} target="_blank" rel="noopener noreferrer" style={{ color: "var(--fp-accent)" }}>
                    {address.slice(0, 10)}…{address.slice(-8)}
                  </a>
                </span>
                <span className={`fp-badge ${enrolled ? "fp-badge-success" : "fp-badge-error"}`}>
                  {enrolled ? "✓ Enrolled" : "✗ Not enrolled"}
                </span>
              </div>

              {/* Balances */}
              <BalanceCard balance={balance} />

              {/* History */}
              <div className="fp-card flex flex-col gap-3">
                <p style={{ fontWeight: 700, fontSize: "0.95rem" }}>Payment history</p>

                {history.length === 0 ? (
                  <p style={{ color: "var(--fp-muted)", fontSize: "0.85rem" }}>No payments yet.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {history.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: "var(--fp-surface-2)",
                          borderRadius: "8px",
                          padding: "0.65rem 0.875rem",
                          gap: "0.5rem",
                        }}
                      >
                        <div className="flex flex-col gap-0.5" style={{ minWidth: 0 }}>
                          <span className="fp-mono" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            → {p.merchant.slice(0, 10)}…{p.merchant.slice(-6)}
                          </span>
                          <span style={{ color: "var(--fp-muted)", fontSize: "0.72rem" }}>
                            {new Date(p.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-0.5" style={{ flexShrink: 0 }}>
                          <span style={{ fontWeight: 700 }}>{p.amount_wbt} WBT</span>
                          <span style={{ color: "var(--fp-accent)", fontSize: "0.78rem" }}>+{p.pwsr} PWSR</span>
                        </div>
                        <a
                          href={p.explorer_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "var(--fp-accent)", fontSize: "0.78rem", flexShrink: 0 }}
                        >
                          ↗
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button className="fp-btn fp-btn-ghost" onClick={reset}>← Switch account</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
