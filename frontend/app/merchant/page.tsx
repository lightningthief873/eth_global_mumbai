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

      <main className="flex flex-col items-center px-5 py-12 md:py-16 flex-1">
        <div style={{ width: "100%", maxWidth: "520px" }} className="flex flex-col gap-7">
          {/* Title */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex flex-col gap-3">
              <span className="fp-eyebrow">Point of sale</span>
              <h1 className="fp-display" style={{ fontSize: "clamp(2rem, 6vw, 2.8rem)" }}>
                Merchant <span className="fp-serif-italic" style={{ color: "var(--fp-accent)" }}>terminal.</span>
              </h1>
            </div>
            <span className="fp-badge fp-badge-info fp-badge-live">Online</span>
          </div>

          {/* Form */}
          {step === "form" && (
            <div className="fp-card flex flex-col gap-5">
              <div>
                <label className="fp-label" htmlFor="merchant">Merchant address (recipient)</label>
                <input
                  id="merchant"
                  className="fp-input"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
                  placeholder="0x…"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                />
              </div>

              <div>
                <label className="fp-label" htmlFor="amount">Amount</label>
                <div
                  className="fp-panel flex items-baseline gap-2"
                  style={{ padding: "1rem 1.1rem" }}
                >
                  <input
                    id="amount"
                    className="fp-display"
                    type="number"
                    min="0"
                    step="0.001"
                    placeholder="0.000"
                    value={amountWbt}
                    onChange={(e) => setAmountWbt(e.target.value)}
                    style={{
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: "var(--foreground)",
                      fontSize: "2.4rem",
                      flex: 1,
                      minWidth: 0,
                      lineHeight: 1,
                    }}
                  />
                  <span className="fp-mono" style={{ fontSize: "0.9rem", color: "var(--fp-muted)", whiteSpace: "nowrap" }}>WBT</span>
                </div>
                {amountWbt && Number(amountWbt) > 0 && (
                  <p className="fp-mono" style={{ fontSize: "0.72rem", marginTop: "0.5rem", color: "var(--fp-accent-dim)" }}>
                    + {(Number(amountWbt) * 100).toFixed(2)} PWSR REWARD
                  </p>
                )}
              </div>

              <button
                className="fp-btn fp-btn-primary"
                disabled={!formValid}
                onClick={() => setStep("scan")}
              >
                Scan customer face →
              </button>
            </div>
          )}

          {/* Scan */}
          {step === "scan" && (
            <div className="fp-card flex flex-col gap-4">
              <div className="fp-panel flex items-center justify-between" style={{ padding: "0.85rem 1.1rem" }}>
                <span className="fp-label" style={{ margin: 0 }}>Charging</span>
                <span className="fp-display" style={{ fontSize: "1.5rem" }}>
                  {amountWbt} <span style={{ fontSize: "0.9rem", color: "var(--fp-muted)" }}>WBT</span>
                </span>
              </div>

              <CameraCapture label="Scan & charge" onCapture={(blob) => { onCapture(blob); }} />

              <button className="fp-btn fp-btn-ghost" onClick={() => setStep("form")}>
                ← Back to form
              </button>
            </div>
          )}

          {/* Charging */}
          {step === "charging" && (
            <div className="fp-card flex flex-col items-center gap-4 py-12">
              <div className="fp-spinner" style={{ width: "2.5rem", height: "2.5rem" }} />
              <p style={{ fontWeight: 650 }}>Processing payment</p>
              <p className="fp-mono" style={{ fontSize: "0.72rem", letterSpacing: "0.1em", color: "var(--fp-muted)", textAlign: "center" }}>
                IDENTIFYING CUSTOMER · SIGNING TX
              </p>
            </div>
          )}

          {/* Done */}
          {step === "done" && receipt && <TxReceipt receipt={receipt} onReset={reset} />}

          {/* Error */}
          {step === "error" && (
            <div className="fp-card" style={{ borderColor: "color-mix(in srgb, var(--fp-error) 50%, var(--fp-border))" }}>
              <p style={{ color: "var(--fp-error)", fontWeight: 650, marginBottom: "0.5rem" }}>Payment failed</p>
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
              className="fp-panel"
              style={{
                padding: "1rem 1.1rem",
                fontSize: "0.82rem",
                color: "var(--fp-muted)",
                lineHeight: 1.65,
                borderColor: "color-mix(in srgb, var(--fp-warning) 28%, var(--fp-border))",
              }}
            >
              <span className="fp-label" style={{ color: "var(--fp-warning)" }}>Demo mode</span>
              Recognition uses deterministic hash-based embeddings. Upload the same
              image file used at enrollment to get a confirmed match.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
