import Link from "next/link";
import Navbar from "@/components/Navbar";

const features = [
  {
    icon: "👤",
    title: "Enroll once",
    desc: "Register your face in seconds. Your biometric template is AES-GCM encrypted and never stored in plaintext.",
  },
  {
    icon: "⚡",
    title: "Pay instantly",
    desc: "Look at the terminal. Your custodial wallet signs a WBT payment on Whitechain — no card, no phone, no prompt.",
  },
  {
    icon: "🎁",
    title: "Earn PWSR rewards",
    desc: "Every payment mints PWSR loyalty tokens directly to your wallet. 100 PWSR per 1 WBT spent.",
  },
  {
    icon: "⛽",
    title: "Zero gas friction",
    desc: "The relayer keeps your wallet topped up with a WBT gas buffer. You never see a gas prompt.",
  },
  {
    icon: "🔒",
    title: "On-chain policy",
    desc: "BiometricRegistry stores a commitment hash and fresh-nonce TTL on Whitechain — no raw biometrics ever touch the chain.",
  },
  {
    icon: "🌐",
    title: "Open protocol",
    desc: "Solidity contracts verified on Blockscout. EVM-compatible. Plugs into any Whitechain dapp.",
  },
];

const steps = [
  { n: "01", title: "Enroll your face", desc: "Visit /enroll, capture a photo, confirm. A custodial EVM wallet is created for you on Whitechain Sepolia." },
  { n: "02", title: "Walk up to the terminal", desc: "The merchant opens /merchant, enters the amount, and taps Scan." },
  { n: "03", title: "Look at the camera", desc: "FacePay identifies you, signs a WBT payment from your wallet, and shows a receipt with an explorer link." },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-24 gap-6">
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "color-mix(in srgb, var(--fp-accent) 12%, transparent)",
            border: "1px solid color-mix(in srgb, var(--fp-accent) 30%, transparent)",
            borderRadius: "999px",
            padding: "0.3rem 0.9rem",
            fontSize: "0.78rem",
            color: "var(--fp-accent)",
            fontWeight: 600,
            marginBottom: "0.5rem",
          }}
        >
          <span>●</span> Live on Whitechain Sepolia
        </div>

        <h1
          style={{ fontSize: "clamp(2.2rem, 6vw, 4rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em", maxWidth: "700px" }}
        >
          Pay with your face.{" "}
          <span style={{ color: "var(--fp-accent)" }}>Powered by Whitechain.</span>
        </h1>

        <p style={{ color: "var(--fp-muted)", fontSize: "1.1rem", maxWidth: "520px", lineHeight: 1.6 }}>
          FacePay is a biometric payment protocol. Enroll once — pay anywhere with
          a glance. No wallet prompts, no gas friction, instant WBT settlement.
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/enroll" className="fp-btn fp-btn-primary" style={{ fontSize: "1rem", padding: "0.75rem 1.75rem" }}>
            Enroll my face →
          </Link>
          <Link href="/merchant" className="fp-btn fp-btn-ghost" style={{ fontSize: "1rem", padding: "0.75rem 1.75rem" }}>
            Open terminal
          </Link>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-5xl mx-auto w-full px-4 pb-20">
        <p style={{ color: "var(--fp-muted)", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "1.5rem", textAlign: "center" }}>
          How it works
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
          {features.map((f) => (
            <div key={f.title} className="fp-card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <span style={{ fontSize: "1.5rem" }}>{f.icon}</span>
              <p style={{ fontWeight: 700, fontSize: "0.95rem" }}>{f.title}</p>
              <p style={{ color: "var(--fp-muted)", fontSize: "0.84rem", lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section
        style={{ background: "var(--fp-surface)", borderTop: "1px solid var(--fp-border)", borderBottom: "1px solid var(--fp-border)" }}
        className="py-20 px-4"
      >
        <div className="max-w-4xl mx-auto flex flex-col gap-10">
          <h2 style={{ fontWeight: 700, fontSize: "1.6rem", textAlign: "center" }}>From enrollment to payment in 3 steps</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
            {steps.map((s) => (
              <div key={s.n} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: "2rem", fontWeight: 800, color: "var(--fp-accent)", opacity: 0.4 }}>{s.n}</span>
                <p style={{ fontWeight: 700, fontSize: "0.95rem" }}>{s.title}</p>
                <p style={{ color: "var(--fp-muted)", fontSize: "0.84rem", lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="flex flex-col items-center gap-5 py-20 px-4 text-center">
        <h2 style={{ fontWeight: 700, fontSize: "1.6rem" }}>Ready to try it?</h2>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/enroll" className="fp-btn fp-btn-primary" style={{ fontSize: "0.95rem", padding: "0.7rem 1.5rem" }}>
            Enroll now
          </Link>
          <Link href="/user" className="fp-btn fp-btn-ghost" style={{ fontSize: "0.95rem", padding: "0.7rem 1.5rem" }}>
            View my dashboard
          </Link>
        </div>
        <p style={{ color: "var(--fp-muted)", fontSize: "0.8rem" }}>
          Testnet only · chain ID 1874 · WBT gas · no real funds
        </p>
      </section>

      {/* Footer */}
      <footer
        style={{ marginTop: "auto", borderTop: "1px solid var(--fp-border)", padding: "1.25rem 1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
      >
        <span style={{ color: "var(--fp-muted)", fontSize: "0.78rem" }}>
          FacePay · Whitechain Sepolia ·{" "}
          <a href="https://explorer.testnet.whitechain.io" target="_blank" rel="noopener noreferrer" style={{ color: "var(--fp-accent)" }}>Explorer</a>
          {" · "}
          <a href="https://faucet.testnet.whitechain.io" target="_blank" rel="noopener noreferrer" style={{ color: "var(--fp-accent)" }}>Faucet</a>
        </span>
      </footer>
    </div>
  );
}
