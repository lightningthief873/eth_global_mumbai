"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import CameraCapture from "@/components/CameraCapture";
import TxReceipt from "@/components/TxReceipt";
import { payment } from "@/lib/api";
import type { ChargeResponse } from "@/lib/api";

type Step = "form" | "scan" | "charging" | "done" | "error";

export default function MerchantPage() {
  const [step, setStep] = useState<Step>("form");
  const [merchant, setMerchant] = useState("");
  const [amountWbt, setAmountWbt] = useState("");
  const [receipt, setReceipt] = useState<ChargeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onCapture(blob: Blob) {
    if (!merchant || !amountWbt) return;
    setStep("charging");
    setError(null);
    try {
      const res = await payment.charge({ merchant, amount_wbt: amountWbt, image: blob });
      setReceipt(res);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStep("error");
    }
  }

  function reset() {
    setStep("form");
    setReceipt(null);
    setError(null);
  }

  const formValid = merchant.startsWith("0x") && merchant.length === 42 && Number(amountWbt) > 0;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex flex-col items-center px-4 py-10 flex-1">
        <div style={{ width: "100%", maxWidth: "520px" }} className="flex flex-col gap-6">

          {/* Title */}
          <div>
            <h1 style={{ fontWeight: 800, fontSize: "1.75rem", letterSpacing: "-0.02em" }}>
              Merchant terminal
            </h1>
            <p style={{ color: "var(--fp-muted)", fontSize: "0.9rem", marginTop: "0.3rem" }}>
              Enter the payment details, then scan the customer's face to charge.
            </p>
          </div>

          {/* Form */}
          {step === "form" && (
            <div className="fp-card flex flex-col gap-4">
              <div>
                <label className="fp-label" htmlFor="merchant">Merchant address (recipient)</label>
                <input
                  id="merchant"
                  className="fp-input"
                  placeholder="0x…"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                />
              </div>

              <div>
                <label className="fp-label" htmlFor="amount">Amount (WBT)</label>
                <input
                  id="amount"
                  className="fp-input"
                  type="number"
                  min="0"
                  step="0.001"
                  placeholder="0.001"
                  value={amountWbt}
                  onChange={(e) => setAmountWbt(e.target.value)}
                />
                {amountWbt && Number(amountWbt) > 0 && (
                  <p style={{ color: "var(--fp-muted)", fontSize: "0.78rem", marginTop: "0.3rem" }}>
                    Reward: {(Number(amountWbt) * 100).toFixed(2)} PWSR
                  </p>
                )}
              </div>

              <button
                className="fp-btn fp-btn-primary"
                disabled={!formValid}
                onClick={() => setStep("scan")}
                style={{ marginTop: "0.25rem" }}
              >
                📸 Scan customer face →
              </button>
            </div>
          )}

          {/* Scan */}
          {step === "scan" && (
            <div className="fp-card flex flex-col gap-4">
              {/* Summary bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "var(--fp-surface-2)",
                  borderRadius: "8px",
                  padding: "0.65rem 0.875rem",
                }}
              >
                <span style={{ color: "var(--fp-muted)", fontSize: "0.82rem" }}>Charging</span>
                <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>{amountWbt} WBT</span>
              </div>

              <CameraCapture
                label="Scan & charge"
                onCapture={(blob) => { onCapture(blob); }}
              />

              <button className="fp-btn fp-btn-ghost" onClick={() => setStep("form")}>
                ← Back to form
              </button>
            </div>
          )}

          {/* Charging */}
          {step === "charging" && (
            <div className="fp-card flex flex-col items-center gap-4 py-10">
              <div style={{ width: "2.5rem", height: "2.5rem", border: "3px solid var(--fp-border)", borderTopColor: "var(--fp-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <p style={{ fontWeight: 600 }}>Processing payment…</p>
              <p style={{ color: "var(--fp-muted)", fontSize: "0.82rem" }}>Identifying customer and signing transaction</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Done */}
          {step === "done" && receipt && (
            <TxReceipt receipt={receipt} onReset={reset} />
          )}

          {/* Error */}
          {step === "error" && (
            <div className="fp-card" style={{ borderColor: "var(--fp-error)" }}>
              <p style={{ color: "var(--fp-error)", fontWeight: 600, marginBottom: "0.5rem" }}>Payment failed</p>
              <p style={{ color: "var(--fp-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>{error}</p>
              <div className="flex gap-2">
                <button className="fp-btn fp-btn-ghost" style={{ flex: 1 }} onClick={() => setStep("scan")}>
                  Retry scan
                </button>
                <button className="fp-btn fp-btn-ghost" style={{ flex: 1 }} onClick={reset}>
                  New payment
                </button>
              </div>
            </div>
          )}

          {/* Demo tip */}
          {step === "form" && (
            <div
              style={{
                background: "color-mix(in srgb, var(--fp-warning) 8%, transparent)",
                border: "1px solid color-mix(in srgb, var(--fp-warning) 25%, transparent)",
                borderRadius: "10px",
                padding: "0.875rem",
                fontSize: "0.82rem",
                color: "var(--fp-muted)",
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: "var(--fp-warning)" }}>Demo mode:</strong> Face recognition uses
              deterministic hash-based embeddings. Upload the same image file you used for enrollment
              to get a confirmed match.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
