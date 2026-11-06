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

      <main className="flex flex-col items-center px-5 py-12 md:py-16 flex-1">
        <div style={{ width: "100%", maxWidth: "600px" }} className="flex flex-col gap-7">
          {/* Title */}
          <div className="flex flex-col gap-3">
            <span className="fp-eyebrow">Customer</span>
            <h1 className="fp-display" style={{ fontSize: "clamp(2rem, 6vw, 2.8rem)" }}>
              Your <span className="fp-serif-italic" style={{ color: "var(--fp-accent)" }}>dashboard.</span>
            </h1>
            <p style={{ color: "var(--fp-muted)", fontSize: "0.92rem" }}>
              Identify by face, or look up any wallet address.
            </p>
          </div>

          {/* Identity selector */}
          {!address && mode === "idle" && (
            <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <button
                className="fp-card flex flex-col items-start gap-2 text-left transition-colors"
                style={{ cursor: "pointer" }}
                onClick={() => setMode("face")}
              >
                <span className="fp-badge fp-badge-info">Face</span>
                <span style={{ fontWeight: 650, fontSize: "1.05rem" }}>Identify by face</span>
                <span style={{ color: "var(--fp-muted)", fontSize: "0.82rem", lineHeight: 1.55 }}>
                  Look at the camera to pull up your wallet.
                </span>
              </button>
              <button
                className="fp-card flex flex-col items-start gap-2 text-left transition-colors"
                style={{ cursor: "pointer" }}
                onClick={() => setMode("address")}
              >
                <span className="fp-badge fp-badge-info">Address</span>
                <span style={{ fontWeight: 650, fontSize: "1.05rem" }}>Enter wallet</span>
                <span style={{ color: "var(--fp-muted)", fontSize: "0.82rem", lineHeight: 1.55 }}>
                  Paste a 0x address to view balances.
                </span>
              </button>
            </div>
          )}

          {/* Face identify */}
          {mode === "face" && (
            <div className="fp-card flex flex-col gap-4">
              <p style={{ fontWeight: 650 }}>Look at the camera</p>
              <CameraCapture label="Identify me" onCapture={(blob) => identifyByFace(blob)} />
              <button className="fp-btn fp-btn-ghost" onClick={() => setMode("idle")}>← Cancel</button>
            </div>
          )}

          {/* Address identify */}
          {mode === "address" && (
            <div className="fp-card flex flex-col gap-4">
              <p style={{ fontWeight: 650 }}>Enter wallet address</p>
              <input
                className="fp-input"
                style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
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
            <div className="fp-card flex items-center justify-center gap-3 py-10">
              <div className="fp-spinner" style={{ width: "1.5rem", height: "1.5rem" }} />
              <span className="fp-mono" style={{ fontSize: "0.76rem", letterSpacing: "0.1em", color: "var(--fp-muted)" }}>
                LOADING…
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="fp-card" style={{ borderColor: "color-mix(in srgb, var(--fp-error) 50%, var(--fp-border))" }}>
              <p style={{ color: "var(--fp-error)", fontWeight: 650, marginBottom: "0.4rem" }}>Error</p>
              <p style={{ color: "var(--fp-muted)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>{error}</p>
              <button className="fp-btn fp-btn-ghost" onClick={reset}>Reset</button>
            </div>
          )}

          {/* Dashboard */}
          {address && balance && !loading && (
            <div className="flex flex-col gap-5 fp-rise">
              {/* Identity row */}
              <div className="flex items-center justify-between gap-3">
                <a href={addressUrl(address)} target="_blank" rel="noopener noreferrer" className="fp-mono fp-link" style={{ fontSize: "0.78rem" }}>
                  {address.slice(0, 12)}…{address.slice(-8)}
                </a>
                <span className={`fp-badge ${enrolled ? "fp-badge-success" : "fp-badge-error"}`}>
                  {enrolled ? "Enrolled" : "Not enrolled"}
                </span>
              </div>

              <BalanceCard balance={balance} />

              {/* History */}
              <div className="fp-card flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p style={{ fontWeight: 650, fontSize: "0.98rem" }}>Payment history</p>
                  <span className="fp-mono" style={{ fontSize: "0.68rem", color: "var(--fp-muted)" }}>
                    {history.length} TX
                  </span>
                </div>

                {history.length === 0 ? (
                  <p style={{ color: "var(--fp-muted)", fontSize: "0.85rem" }}>No payments yet.</p>
                ) : (
                  <div className="flex flex-col">
                    {history.map((p, i) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-3 py-3"
                        style={{ borderTop: i === 0 ? "none" : "1px solid var(--fp-border-soft)" }}
                      >
                        <div className="flex flex-col gap-0.5" style={{ minWidth: 0 }}>
                          <span className="fp-mono" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--foreground)" }}>
                            → {p.merchant.slice(0, 10)}…{p.merchant.slice(-6)}
                          </span>
                          <span className="fp-mono" style={{ fontSize: "0.66rem" }}>
                            {new Date(p.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 shrink-0">
                          <span style={{ fontWeight: 650 }}>{p.amount_wbt} WBT</span>
                          <span className="fp-mono" style={{ color: "var(--fp-accent)", fontSize: "0.72rem" }}>+{p.pwsr} PWSR</span>
                        </div>
                        <a href={p.explorer_url} target="_blank" rel="noopener noreferrer" className="fp-link shrink-0" style={{ fontSize: "0.85rem" }}>↗</a>
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
