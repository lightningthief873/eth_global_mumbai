"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import CameraCapture from "@/components/CameraCapture";
import { face } from "@/lib/api";
import type { EnrollResponse } from "@/lib/api";

type Step = "capture" | "confirm" | "enrolling" | "done" | "error";

const rail: { key: Step[]; label: string }[] = [
  { key: ["capture"], label: "Capture" },
  { key: ["confirm", "enrolling"], label: "Confirm" },
  { key: ["done"], label: "Enrolled" },
];

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

  const activeIdx = rail.findIndex((r) => r.key.includes(step));

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex flex-col items-center px-5 py-12 md:py-16 flex-1">
        <div style={{ width: "100%", maxWidth: "440px" }} className="flex flex-col gap-7">
          {/* Title */}
          <div className="flex flex-col gap-3">
            <span className="fp-eyebrow">Step into the protocol</span>
            <h1 className="fp-display" style={{ fontSize: "clamp(2rem, 6vw, 2.8rem)" }}>
              Enroll your <span className="fp-serif-italic" style={{ color: "var(--fp-accent)" }}>face.</span>
            </h1>
            <p style={{ color: "var(--fp-muted)", fontSize: "0.92rem", lineHeight: 1.6 }}>
              One capture creates a custodial Whitechain wallet. No personal data is
              stored — only an encrypted biometric embedding.
            </p>
          </div>

          {/* Step rail */}
          <div className="flex items-center gap-2">
            {rail.map((r, i) => {
              const active = i === activeIdx;
              const done = i < activeIdx;
              return (
                <div key={r.label} className="flex items-center gap-2 flex-1">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div
                      style={{
                        height: "2px",
                        borderRadius: "2px",
                        background: active || done ? "var(--fp-accent)" : "var(--fp-border)",
                        transition: "background 0.3s",
                      }}
                    />
                    <span
                      className="fp-mono"
                      style={{
                        fontSize: "0.6rem",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: active ? "var(--foreground)" : "var(--fp-muted-2)",
                      }}
                    >
                      {r.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Step: capture / confirm */}
          {(step === "capture" || step === "confirm") && (
            <div className="flex flex-col gap-4">
              <CameraCapture onCapture={onCapture} label="Capture face" />

              {step === "confirm" && preview && (
                <div className="fp-card flex flex-col gap-4">
                  <p style={{ fontWeight: 650 }}>Confirm enrollment</p>
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
                      Enroll my face
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step: enrolling */}
          {step === "enrolling" && (
            <div className="fp-card flex flex-col items-center gap-4 py-12">
              <div className="fp-spinner" style={{ width: "2.5rem", height: "2.5rem" }} />
              <p className="fp-mono" style={{ letterSpacing: "0.12em", fontSize: "0.78rem", color: "var(--fp-muted)" }}>
                ENROLLING ON-CHAIN…
              </p>
            </div>
          )}

          {/* Step: done */}
          {step === "done" && result && (
            <div className="fp-card flex flex-col gap-4 fp-rise">
              <div className="flex items-center gap-2">
                <span className="fp-badge fp-badge-success">Enrolled</span>
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
                style={{ textDecoration: "none" }}
              >
                View registry tx ↗
              </a>
              <button className="fp-btn fp-btn-primary" onClick={reset}>
                Enroll another face
              </button>
            </div>
          )}

          {/* Step: error */}
          {step === "error" && (
            <div className="fp-card" style={{ borderColor: "color-mix(in srgb, var(--fp-error) 50%, var(--fp-border))" }}>
              <p style={{ color: "var(--fp-error)", fontWeight: 650, marginBottom: "0.5rem" }}>Enrollment failed</p>
              <p style={{ color: "var(--fp-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>{error}</p>
              <button className="fp-btn fp-btn-ghost" onClick={reset}>Try again</button>
            </div>
          )}

          {/* Privacy note */}
          {step === "capture" && (
            <div
              className="fp-panel"
              style={{
                padding: "1rem 1.1rem",
                fontSize: "0.82rem",
                color: "var(--fp-muted)",
                lineHeight: 1.65,
                borderColor: "color-mix(in srgb, var(--fp-accent) 20%, var(--fp-border))",
              }}
            >
              <span className="fp-label" style={{ color: "var(--fp-accent-dim)" }}>Privacy</span>
              Your face image is processed in-memory and immediately discarded. Only an
              encrypted numerical embedding is stored. Re-enroll anytime to update it.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
