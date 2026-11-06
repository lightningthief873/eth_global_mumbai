"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import CameraCapture from "@/components/CameraCapture";
import { checkout } from "@/lib/checkout";
import type { Invoice } from "@/lib/checkout";

type Mode = "idle" | "face" | "address" | "paying" | "error";

export default function CheckoutClient() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [inv, setInv] = useState<Invoice | null>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setInv(await checkout.getInvoice(invoiceId));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [invoiceId]);

  async function payFace(blob: Blob) {
    setMode("paying");
    setError(null);
    try {
      setInv(await checkout.payByFace(invoiceId, blob));
      setMode("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setMode("error");
    }
  }

  async function payAddress() {
    setMode("paying");
    setError(null);
    try {
      setInv(await checkout.payByAddress(invoiceId, address));
      setMode("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setMode("error");
    }
  }

  const paid = inv && inv.status !== "open";

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex flex-col items-center px-4 py-10 flex-1">
        <div style={{ width: "100%", maxWidth: "440px" }} className="flex flex-col gap-6">

          {loading && <p style={{ color: "var(--fp-muted)" }}>Loading invoice…</p>}

          {inv && (
            <>
              {/* Invoice summary */}
              <div className="fp-card flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="fp-label" style={{ margin: 0 }}>Invoice {inv.id}</span>
                  <span className={`fp-badge ${paid ? "fp-badge-success" : "fp-badge-info"}`}>
                    {inv.status}
                  </span>
                </div>
                <div className="flex items-end gap-2">
                  <span style={{ fontSize: "2.4rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
                    {inv.amount_usdt}
                  </span>
                  <span style={{ color: "var(--fp-muted)", fontWeight: 700, marginBottom: "0.5rem" }}>USDT</span>
                </div>
                {inv.description && <p style={{ color: "var(--fp-muted)", fontSize: "0.9rem" }}>{inv.description}</p>}
                <div>
                  <span className="fp-label">Pay to merchant</span>
                  <p className="fp-mono">{inv.merchant_address}</p>
                </div>
              </div>

              {/* Receipt (paid) */}
              {paid && (
                <div className="fp-card flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: "1.5rem" }}>✅</span>
                    <p style={{ fontWeight: 700 }}>
                      {inv.status === "refunded" ? "Paid & fully refunded"
                        : inv.status === "partially_refunded" ? "Paid (partial refund issued)"
                        : "Payment settled in USDT"}
                    </p>
                  </div>
                  {inv.payer_address && (
                    <div><span className="fp-label">Paid by</span><p className="fp-mono">{inv.payer_address}</p></div>
                  )}
                  {Number(inv.refunded_units) > 0 && (
                    <p style={{ color: "var(--fp-warning)", fontSize: "0.85rem" }}>
                      Refunded: {inv.refunded_usdt} USDT
                    </p>
                  )}
                  {inv.explorer_url && (
                    <a className="fp-btn fp-btn-ghost" href={inv.explorer_url} target="_blank" rel="noopener noreferrer"
                       style={{ textDecoration: "none", justifyContent: "center" }}>
                      View payment on explorer ↗
                    </a>
                  )}
                  {inv.refund_explorer_url && (
                    <a className="fp-btn fp-btn-ghost" href={inv.refund_explorer_url} target="_blank" rel="noopener noreferrer"
                       style={{ textDecoration: "none", justifyContent: "center" }}>
                      View refund on explorer ↗
                    </a>
                  )}
                </div>
              )}

              {/* Pay options (open) */}
              {!paid && mode === "idle" && (
                <div className="flex flex-col gap-3">
                  <button className="fp-btn fp-btn-primary" onClick={() => setMode("face")}>
                    👤 Pay with your face
                  </button>
                  <button className="fp-btn fp-btn-ghost" onClick={() => setMode("address")}>
                    🔑 Pay with wallet address
                  </button>
                  <p style={{ color: "var(--fp-muted)", fontSize: "0.78rem", textAlign: "center" }}>
                    Gasless — the relayer sponsors gas; you pay only USDT.
                  </p>
                </div>
              )}

              {!paid && mode === "face" && (
                <div className="fp-card flex flex-col gap-4">
                  <p style={{ fontWeight: 600 }}>Look at the camera to pay</p>
                  <CameraCapture label="Pay by face" onCapture={(b) => payFace(b)} />
                  <button className="fp-btn fp-btn-ghost" onClick={() => setMode("idle")}>← Back</button>
                </div>
              )}

              {!paid && mode === "address" && (
                <div className="fp-card flex flex-col gap-3">
                  <label className="fp-label" htmlFor="addr">Your custodial wallet address</label>
                  <input id="addr" className="fp-input" placeholder="0x…" value={address}
                         onChange={(e) => setAddress(e.target.value)} />
                  <div className="flex gap-2">
                    <button className="fp-btn fp-btn-ghost" style={{ flex: 1 }} onClick={() => setMode("idle")}>← Back</button>
                    <button className="fp-btn fp-btn-primary" style={{ flex: 2 }}
                            disabled={!address.startsWith("0x") || address.length !== 42}
                            onClick={payAddress}>
                      Pay {inv.amount_usdt} USDT
                    </button>
                  </div>
                </div>
              )}

              {mode === "paying" && (
                <div className="fp-card flex flex-col items-center gap-3 py-8">
                  <div style={{ width: "2rem", height: "2rem", border: "3px solid var(--fp-border)", borderTopColor: "var(--fp-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <p style={{ color: "var(--fp-muted)" }}>Settling on Whitechain…</p>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              )}

              {(mode === "error" || error) && !paid && (
                <div className="fp-card" style={{ borderColor: "var(--fp-error)" }}>
                  <p style={{ color: "var(--fp-error)", fontWeight: 600, marginBottom: "0.4rem" }}>Payment failed</p>
                  <p style={{ color: "var(--fp-muted)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>{error}</p>
                  <button className="fp-btn fp-btn-ghost" onClick={() => { setMode("idle"); setError(null); }}>Try again</button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
