"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import CameraCapture from "@/components/CameraCapture";
import { face } from "@/lib/api";
import type { EnrollResponse } from "@/lib/api";

type Step = "capture" | "confirm" | "enrolling" | "done" | "error";

export default function EnrollPage() {
  const [step, setStep] = useState<Step>("capture");
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [alias, setAlias] = useState("");
  const [result, setResult] = useState<EnrollResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onCapture(blob: Blob, url: string) {
    setCapturedBlob(blob);
    setPreview(url);
    setStep("confirm");
  }

  async function enroll() {
    if (!capturedBlob) return;
    setStep("enrolling");
    setError(null);
    try {
      const res = await face.enroll(capturedBlob, alias || undefined);
      setResult(res);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStep("error");
    }
  }

  function reset() {
    setStep("capture");
    setCapturedBlob(null);
    setPreview(null);
    setAlias("");
    setResult(null);
    setError(null);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex flex-col items-center px-4 py-12 flex-1">
        <div style={{ width: "100%", maxWidth: "420px" }} className="flex flex-col gap-6">

          {/* Title */}
          <div>
            <h1 style={{ fontWeight: 800, fontSize: "1.75rem", letterSpacing: "-0.02em" }}>Enroll your face</h1>
            <p style={{ color: "var(--fp-muted)", fontSize: "0.9rem", marginTop: "0.3rem" }}>
              Your face creates a custodial Whitechain wallet. No personal data is stored — only an encrypted biometric embedding.
            </p>
          </div>

          {/* Step: capture */}
          {(step === "capture" || step === "confirm") && (
            <div className="flex flex-col gap-4">
              <CameraCapture onCapture={onCapture} label="Capture face" />

              {step === "confirm" && preview && (
                <div className="fp-card flex flex-col gap-4">
                  <p style={{ fontWeight: 600 }}>Confirm enrollment</p>

                  <div>
                    <label className="fp-label" htmlFor="alias">Name / alias (optional)</label>
                    <input
                      id="alias"
                      className="fp-input"
                      placeholder="e.g. John"
                      value={alias}
                      onChange={(e) => setAlias(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button className="fp-btn fp-btn-ghost" style={{ flex: 1 }} onClick={reset}>← Retake</button>
                    <button className="fp-btn fp-btn-primary" style={{ flex: 2 }} onClick={enroll}>
                      ✓ Enroll
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step: enrolling */}
          {step === "enrolling" && (
            <div className="fp-card flex flex-col items-center gap-4 py-10">
              <div style={{ width: "2.5rem", height: "2.5rem", border: "3px solid var(--fp-border)", borderTopColor: "var(--fp-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <p style={{ color: "var(--fp-muted)" }}>Enrolling…</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Step: done */}
          {step === "done" && result && (
            <div className="fp-card flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: "1.5rem" }}>🎉</span>
                <p style={{ fontWeight: 700, fontSize: "1rem" }}>Enrolled successfully</p>
              </div>

              <div>
                <span className="fp-label">Your wallet address</span>
                <p className="fp-mono" style={{ color: "var(--fp-accent)" }}>{result.address}</p>
              </div>

              <div>
                <span className="fp-label">Commitment (on-chain)</span>
                <p className="fp-mono">{result.commitment.slice(0, 34)}…</p>
              </div>

              <a
                href={result.explorer_url}
                target="_blank"
                rel="noopener noreferrer"
                className="fp-btn fp-btn-ghost"
                style={{ textDecoration: "none", justifyContent: "center" }}
              >
                View registry tx on explorer ↗
              </a>

              <button className="fp-btn fp-btn-primary" onClick={reset}>
                Enroll another face
              </button>
            </div>
          )}

          {/* Step: error */}
          {step === "error" && (
            <div className="fp-card" style={{ borderColor: "var(--fp-error)" }}>
              <p style={{ color: "var(--fp-error)", fontWeight: 600, marginBottom: "0.5rem" }}>Enrollment failed</p>
              <p style={{ color: "var(--fp-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>{error}</p>
              <button className="fp-btn fp-btn-ghost" onClick={reset}>Try again</button>
            </div>
          )}

          {/* Info callout */}
          {step === "capture" && (
            <div
              style={{
                background: "color-mix(in srgb, var(--fp-accent) 8%, transparent)",
                border: "1px solid color-mix(in srgb, var(--fp-accent) 20%, transparent)",
                borderRadius: "10px",
                padding: "1rem",
                fontSize: "0.82rem",
                color: "var(--fp-muted)",
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: "var(--foreground)" }}>Privacy note:</strong> Your face image is processed
              in-memory and immediately discarded. Only an encrypted numerical embedding is stored.
              You can re-enroll at any time to update your template.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
