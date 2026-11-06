import Link from "next/link";
import Navbar from "@/components/Navbar";

const features = [
  {
    k: "01",
    title: "Enroll once",
    desc: "Register your face in seconds. The biometric template is AES-GCM encrypted — never stored in plaintext, never on-chain.",
  },
  {
    k: "02",
    title: "Pay with a glance",
    desc: "Look at the terminal. Your custodial wallet signs a WBT payment on Whitechain. No card, no phone, no prompt.",
  },
  {
    k: "03",
    title: "Earn PWSR rewards",
    desc: "Every payment mints PWSR loyalty tokens straight to your wallet — 100 PWSR for each WBT spent.",
  },
  {
    k: "04",
    title: "Zero gas friction",
    desc: "A relayer keeps your wallet topped up with a WBT gas buffer. You never see, hold, or pay a gas prompt.",
  },
  {
    k: "05",
    title: "On-chain policy",
    desc: "BiometricRegistry holds only a commitment hash with a fresh-nonce TTL. No raw biometrics ever touch the chain.",
  },
  {
    k: "06",
    title: "Open protocol",
    desc: "Solidity contracts verified on Blockscout. EVM-compatible. Plugs into any Whitechain dapp.",
  },
];

const steps = [
  {
    n: "01",
    title: "Enroll your face",
    desc: "Capture a photo, confirm consent. A custodial EVM wallet is created for you on Whitechain Sepolia.",
  },
  {
    n: "02",
    title: "Walk up to the terminal",
    desc: "The merchant enters an amount and taps scan. No account lookup, no card reader.",
  },
  {
    n: "03",
    title: "Look at the camera",
    desc: "FacePay recognizes you, signs the WBT payment, mints rewards, and returns a receipt with an explorer link.",
  },
];

function Reticle() {
  return (
    <svg viewBox="0 0 360 360" width="100%" height="100%" fill="none" role="img" aria-label="Biometric face reticle">
      <defs>
        <radialGradient id="g" cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor="var(--fp-accent)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--fp-accent)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="20" y="20" width="320" height="320" rx="24" fill="url(#g)" />
      {/* corner brackets */}
      {[
        "M40 86 L40 52 Q40 40 52 40 L86 40",
        "M274 40 L308 40 Q320 40 320 52 L320 86",
        "M320 274 L320 308 Q320 320 308 320 L274 320",
        "M86 320 L52 320 Q40 320 40 308 L40 274",
      ].map((d) => (
        <path key={d} d={d} stroke="var(--fp-accent)" strokeWidth="2" strokeLinecap="round" />
      ))}
      {/* concentric scan rings */}
      <circle cx="180" cy="168" r="78" stroke="var(--fp-border)" strokeWidth="1.25" />
      <circle cx="180" cy="168" r="78" stroke="var(--fp-accent)" strokeWidth="1.5" strokeDasharray="6 14" opacity="0.8" />
      <circle cx="180" cy="168" r="48" stroke="var(--fp-border)" strokeWidth="1.25" />
      {/* crosshair */}
      <path d="M180 100 L180 130 M180 206 L180 236 M112 168 L142 168 M218 168 L248 168" stroke="var(--fp-muted)" strokeWidth="1.25" strokeLinecap="round" />
      {/* face glyph */}
      <path d="M152 150 q0 -6 6 -6 M202 150 q0 -6 6 -6" stroke="var(--fp-accent)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M180 160 L180 178 M172 192 q8 8 16 0" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* baseline readout */}
      <text x="180" y="292" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" letterSpacing="3" fill="var(--fp-muted)">
        MATCH 0.98 · SIGNED
      </text>
    </svg>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-5 py-16 md:py-24 grid gap-14 md:grid-cols-[1.15fr_0.85fr] md:items-center">
          <div className="flex flex-col gap-7">
            <span className="fp-eyebrow fp-rise" style={{ animationDelay: "0.05s" }}>
              Biometric payment protocol · Whitechain
            </span>

            <h1 className="fp-display fp-rise" style={{ fontSize: "clamp(2.8rem, 7vw, 5.2rem)", animationDelay: "0.12s" }}>
              Pay with
              <br />
              your <span className="fp-serif-italic" style={{ color: "var(--fp-accent)" }}>face.</span>
            </h1>

            <p className="fp-rise" style={{ color: "var(--fp-muted)", fontSize: "1.1rem", maxWidth: "46ch", lineHeight: 1.65, animationDelay: "0.2s" }}>
              Enroll once — then settle in WBT with nothing but a glance. No card,
              no phone, no wallet prompt, no gas. Just your face and a terminal.
            </p>

            <div className="flex flex-wrap gap-3 fp-rise" style={{ animationDelay: "0.28s" }}>
              <Link href="/enroll" className="fp-btn fp-btn-primary" style={{ fontSize: "1rem", padding: "0.85rem 1.8rem" }}>
                Enroll my face
                <span aria-hidden>→</span>
              </Link>
              <Link href="/merchant" className="fp-btn fp-btn-ghost" style={{ fontSize: "1rem", padding: "0.85rem 1.8rem" }}>
                Open terminal
              </Link>
            </div>

            <div className="flex items-center gap-3 fp-rise" style={{ animationDelay: "0.36s" }}>
              <span className="fp-badge fp-badge-info fp-badge-live">Live on Sepolia</span>
              <span className="fp-mono" style={{ fontSize: "0.74rem" }}>chain 1874 · WBT gas · testnet</span>
            </div>
          </div>

          {/* Scanner graphic */}
          <div className="fp-rise mx-auto w-full" style={{ maxWidth: "420px", animationDelay: "0.24s" }}>
            <div className="fp-reticle fp-panel relative overflow-hidden" style={{ aspectRatio: "1", padding: "0", borderRadius: "20px" }}>
              <div className="fp-scanline" style={{ top: "12%" }} />
              <div className="absolute inset-0 p-4">
                <Reticle />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto w-full px-5 py-10">
        <div className="flex items-baseline justify-between mb-8 flex-wrap gap-2">
          <h2 className="fp-display" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)" }}>
            A protocol built for <span className="fp-serif-italic" style={{ color: "var(--fp-accent)" }}>one tap</span> of attention.
          </h2>
          <span className="fp-eyebrow">What you get</span>
        </div>

        <div className="grid gap-px rounded-2xl overflow-hidden" style={{ background: "var(--fp-border-soft)", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {features.map((f) => (
            <div
              key={f.k}
              className="group flex flex-col gap-3 p-7 transition-colors"
              style={{ background: "var(--fp-ink)" }}
            >
              <div className="flex items-center justify-between">
                <span className="fp-mono" style={{ color: "var(--fp-accent)", fontSize: "0.72rem", letterSpacing: "0.2em" }}>
                  {f.k}
                </span>
                <span
                  aria-hidden
                  className="transition-transform group-hover:translate-x-0.5"
                  style={{ color: "var(--fp-muted-2)" }}
                >
                  ↗
                </span>
              </div>
              <h3 style={{ fontWeight: 650, fontSize: "1.05rem", letterSpacing: "-0.01em" }}>{f.title}</h3>
              <p style={{ color: "var(--fp-muted)", fontSize: "0.88rem", lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="relative py-20 px-5 mt-8" style={{ borderTop: "1px solid var(--fp-border-soft)", borderBottom: "1px solid var(--fp-border-soft)", background: "var(--fp-surface)" }}>
        <div className="max-w-6xl mx-auto flex flex-col gap-12">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <h2 className="fp-display" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)" }}>
              Enrollment to payment, in three.
            </h2>
            <span className="fp-eyebrow">The flow</span>
          </div>
          <div className="grid gap-10" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            {steps.map((s) => (
              <div key={s.n} className="flex flex-col gap-3 pt-5" style={{ borderTop: "1.5px solid var(--fp-accent)" }}>
                <span className="fp-display" style={{ fontSize: "3rem", color: "var(--fp-accent)", lineHeight: 1 }}>{s.n}</span>
                <h3 style={{ fontWeight: 650, fontSize: "1.05rem" }}>{s.title}</h3>
                <p style={{ color: "var(--fp-muted)", fontSize: "0.88rem", lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto w-full px-5 py-24 text-center flex flex-col items-center gap-7">
        <h2 className="fp-display" style={{ fontSize: "clamp(2rem, 5vw, 3.4rem)", maxWidth: "16ch" }}>
          Your face is the <span className="fp-serif-italic" style={{ color: "var(--fp-accent)" }}>only</span> credential you need.
        </h2>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/enroll" className="fp-btn fp-btn-primary" style={{ fontSize: "1rem", padding: "0.85rem 1.8rem" }}>
            Enroll now <span aria-hidden>→</span>
          </Link>
          <Link href="/user" className="fp-btn fp-btn-ghost" style={{ fontSize: "1rem", padding: "0.85rem 1.8rem" }}>
            View my dashboard
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto" style={{ borderTop: "1px solid var(--fp-border-soft)" }}>
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-wrap items-center justify-between gap-4">
          <span className="fp-mono" style={{ fontSize: "0.74rem" }}>
            FacePay · Whitechain Sepolia · chain 1874
          </span>
          <span className="flex items-center gap-4">
            <a href="https://explorer.testnet.whitechain.io" target="_blank" rel="noopener noreferrer" className="fp-link fp-mono" style={{ fontSize: "0.74rem" }}>
              Explorer ↗
            </a>
            <a href="https://faucet.testnet.whitechain.io" target="_blank" rel="noopener noreferrer" className="fp-link fp-mono" style={{ fontSize: "0.74rem" }}>
              Faucet ↗
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
