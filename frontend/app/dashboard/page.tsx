"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { checkout } from "@/lib/checkout";
import type { Invoice, Merchant } from "@/lib/checkout";

export default function DashboardPage() {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [name, setName] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [lastLink, setLastLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore merchant from localStorage
  useEffect(() => {
    const raw = localStorage.getItem("facepay_merchant");
    if (raw) setMerchant(JSON.parse(raw));
  }, []);

  useEffect(() => { if (merchant) refresh(); /* eslint-disable-next-line */ }, [merchant]);

  async function refresh() {
    if (!merchant) return;
    try { setInvoices(await checkout.listInvoices(merchant.api_key)); } catch {}
  }

  async function onboard() {
    setBusy(true); setError(null);
    try {
      const m = await checkout.createMerchant(name || "My Store");
      localStorage.setItem("facepay_merchant", JSON.stringify(m));
      setMerchant(m);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  async function createLink() {
    if (!merchant) return;
    setBusy(true); setError(null);
    try {
      const inv = await checkout.createInvoice(merchant.api_key, amount, desc || undefined);
      const url = `${window.location.origin}/pay/${inv.id}`;
      setLastLink(url);
      setAmount(""); setDesc("");
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  async function doRefund(id: string, full: boolean, remaining: string) {
    if (!merchant) return;
    const amt = full ? undefined : prompt(`Refund amount USDT (remaining ${remaining})`) ?? undefined;
    if (!full && !amt) return;
    try { await checkout.refund(merchant.api_key, id, amt); await refresh(); }
    catch (e) { alert(e instanceof Error ? e.message : String(e)); }
  }

  function logout() {
    localStorage.removeItem("facepay_merchant");
    setMerchant(null); setInvoices([]);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex flex-col items-center px-4 py-10 flex-1">
        <div style={{ width: "100%", maxWidth: "720px" }} className="flex flex-col gap-6">
          <h1 style={{ fontWeight: 800, fontSize: "1.75rem", letterSpacing: "-0.02em" }}>Merchant dashboard</h1>

          {/* Onboard */}
          {!merchant ? (
            <div className="fp-card flex flex-col gap-3">
              <p style={{ fontWeight: 600 }}>Create a merchant account</p>
              <input className="fp-input" placeholder="Store name" value={name} onChange={(e) => setName(e.target.value)} />
              <button className="fp-btn fp-btn-primary" disabled={busy} onClick={onboard}>Create account</button>
              {error && <p style={{ color: "var(--fp-error)", fontSize: "0.82rem" }}>{error}</p>}
            </div>
          ) : (
            <>
              {/* Account + API key */}
              <div className="fp-card flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span style={{ fontWeight: 700 }}>{merchant.name}</span>
                  <button className="fp-btn fp-btn-ghost" style={{ padding: "0.3rem 0.75rem", fontSize: "0.78rem" }} onClick={logout}>Switch</button>
                </div>
                <div><span className="fp-label">Payout wallet (receives USDT)</span><p className="fp-mono">{merchant.address}</p></div>
                <div><span className="fp-label">API key (for your store / SDK)</span><p className="fp-mono" style={{ color: "var(--fp-accent)" }}>{merchant.api_key}</p></div>
              </div>

              {/* Create payment link */}
              <div className="fp-card flex flex-col gap-3">
                <p style={{ fontWeight: 600 }}>New payment link / invoice</p>
                <div className="flex gap-2">
                  <input className="fp-input" type="number" step="0.01" placeholder="Amount USDT" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  <input className="fp-input" placeholder="Description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} />
                </div>
                <button className="fp-btn fp-btn-primary" disabled={busy || !(Number(amount) > 0)} onClick={createLink}>
                  Create payment link
                </button>
                {lastLink && (
                  <div style={{ background: "var(--fp-surface-2)", borderRadius: "8px", padding: "0.65rem 0.875rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <a href={lastLink} target="_blank" rel="noopener noreferrer" className="fp-mono" style={{ color: "var(--fp-accent)", flex: 1 }}>{lastLink}</a>
                    <button className="fp-btn fp-btn-ghost" style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}
                            onClick={() => navigator.clipboard.writeText(lastLink)}>Copy</button>
                  </div>
                )}
                {error && <p style={{ color: "var(--fp-error)", fontSize: "0.82rem" }}>{error}</p>}
              </div>

              {/* Invoices */}
              <div className="fp-card flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p style={{ fontWeight: 700 }}>Invoices</p>
                  <button className="fp-btn fp-btn-ghost" style={{ padding: "0.3rem 0.75rem", fontSize: "0.78rem" }} onClick={refresh}>Refresh</button>
                </div>
                {invoices.length === 0 ? (
                  <p style={{ color: "var(--fp-muted)", fontSize: "0.85rem" }}>No invoices yet.</p>
                ) : invoices.map((inv) => (
                  <div key={inv.id} style={{ background: "var(--fp-surface-2)", borderRadius: "8px", padding: "0.75rem 0.875rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="flex items-center gap-2">
                        <span style={{ fontWeight: 700 }}>{inv.amount_usdt} USDT</span>
                        <span className={`fp-badge ${inv.status === "paid" ? "fp-badge-success" : inv.status === "open" ? "fp-badge-info" : "fp-badge-error"}`}>{inv.status}</span>
                      </div>
                      <span style={{ color: "var(--fp-muted)", fontSize: "0.74rem" }}>{inv.description ?? inv.id}</span>
                    </div>
                    {inv.explorer_url && (
                      <a href={inv.explorer_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--fp-accent)", fontSize: "0.78rem" }}>tx ↗</a>
                    )}
                    {inv.status === "open" && (
                      <a href={`/pay/${inv.id}`} target="_blank" rel="noopener noreferrer" className="fp-btn fp-btn-ghost" style={{ padding: "0.3rem 0.7rem", fontSize: "0.75rem", textDecoration: "none" }}>Pay link</a>
                    )}
                    {(inv.status === "paid" || inv.status === "partially_refunded") && (
                      <button className="fp-btn fp-btn-ghost" style={{ padding: "0.3rem 0.7rem", fontSize: "0.75rem" }}
                              onClick={() => doRefund(inv.id, false, (Number(inv.amount_usdt) - Number(inv.refunded_usdt)).toFixed(2))}>
                        Refund
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
