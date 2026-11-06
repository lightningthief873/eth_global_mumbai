"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/enroll", label: "Enroll" },
  { href: "/merchant", label: "Merchant" },
  { href: "/user", label: "Dashboard" },
];

export default function Navbar() {
  const path = usePathname();
  return (
    <nav
      style={{ background: "var(--fp-surface)", borderBottom: "1px solid var(--fp-border)" }}
      className="sticky top-0 z-50"
    >
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <span
            style={{ background: "var(--fp-accent)", borderRadius: "6px" }}
            className="w-7 h-7 flex items-center justify-center text-white text-sm font-black"
          >
            F
          </span>
          <span>FacePay</span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-1">
          {links.map(({ href, label }) => {
            const active = path === href;
            return (
              <Link
                key={href}
                href={href}
                style={{
                  color: active ? "var(--fp-accent)" : "var(--fp-muted)",
                  background: active ? "color-mix(in srgb, var(--fp-accent) 10%, transparent)" : "transparent",
                  borderRadius: "6px",
                  padding: "0.3rem 0.75rem",
                  fontSize: "0.875rem",
                  fontWeight: active ? 600 : 400,
                  transition: "all 0.15s",
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
