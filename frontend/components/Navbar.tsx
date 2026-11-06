"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/enroll", label: "Enroll" },
  { href: "/dashboard", label: "Merchant" },
  { href: "/merchant", label: "Terminal" },
];

export default function Navbar() {
  const path = usePathname();
  return (
    <nav className="sticky top-0 z-40 backdrop-blur-md" style={{ background: "color-mix(in srgb, var(--fp-ink) 80%, transparent)", borderBottom: "1px solid var(--fp-border-soft)" }}>
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <span
            aria-hidden
            className="relative flex items-center justify-center"
            style={{
              width: "2rem",
              height: "2rem",
              border: "1.5px solid var(--fp-accent)",
              borderRadius: "9px",
              background: "color-mix(in srgb, var(--fp-accent) 10%, transparent)",
            }}
          >
            <span
              style={{
                width: "0.6rem",
                height: "0.6rem",
                border: "1.5px solid var(--fp-accent)",
                borderRadius: "999px",
              }}
            />
          </span>
          <span className="text-lg tracking-tight" style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
            Face<span style={{ color: "var(--fp-accent)" }}>Pay</span>
          </span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-1">
          {links.map(({ href, label }) => {
            const active = path === href;
            return (
              <Link
                key={href}
                href={href}
                className="relative px-3.5 py-2 transition-colors"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.74rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: active ? "var(--foreground)" : "var(--fp-muted)",
                }}
              >
                {label}
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: "0.875rem",
                    right: "0.875rem",
                    bottom: "0.35rem",
                    height: "1.5px",
                    background: "var(--fp-accent)",
                    transformOrigin: "left",
                    transform: active ? "scaleX(1)" : "scaleX(0)",
                    transition: "transform 0.2s ease",
                  }}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
