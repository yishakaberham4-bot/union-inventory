"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { href: "/auditor/reports", label: "Reports", icon: "📊", color: "#10b981" },
  { href: "/auditor/sales-closing", label: "Sales Closing", icon: "🔒", color: "#f59e0b" },
];

export default function AuditorSidebar({ staffLabel }: { staffLabel: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/auditor/reports") {
      return (
        pathname === "/auditor" ||
        pathname === "/auditor/" ||
        pathname.startsWith("/auditor/reports")
      );
    }
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Top bar */}
      <header
        style={{
          background: "linear-gradient(135deg, #0f766e 0%, #0d9488 40%, #14b8a6 100%)",
          color: "#fff",
          padding: "0.75rem 1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          boxShadow: "0 4px 20px rgba(15, 118, 110, 0.35)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              border: "none",
              background: "rgba(255,255,255,0.18)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {open ? "✕" : "☰"}
          </button>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.02em" }}>
              Union TMS
            </div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>Auditor Console</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              background: "rgba(255,255,255,0.15)",
              borderRadius: 999,
              padding: "6px 14px",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            👤 {staffLabel}
          </div>
          <button
            type="button"
            onClick={logout}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.35)",
              color: "#fff",
              borderRadius: 10,
              padding: "8px 14px",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            zIndex: 40,
          }}
        />
      )}

      {/* Drawer */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: 280,
          background: "linear-gradient(180deg, #0f172a 0%, #134e4a 100%)",
          color: "#fff",
          zIndex: 45,
          transform: open ? "translateX(0)" : "translateX(-105%)",
          transition: "transform 0.25s ease",
          boxShadow: open ? "8px 0 32px rgba(0,0,0,0.35)" : "none",
          display: "flex",
          flexDirection: "column",
          padding: "1.25rem",
        }}
      >
        <div style={{ marginBottom: "1.75rem", paddingTop: "0.5rem" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: "linear-gradient(135deg, #14b8a6, #0ea5e9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 18,
              marginBottom: 12,
            }}
          >
            UT
          </div>
          <div style={{ fontWeight: 800, fontSize: "1.2rem" }}>Union TMS</div>
          <div style={{ fontSize: 13, color: "#99f6e4", marginTop: 2 }}>
            Auditor Console
          </div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 12,
                  textDecoration: "none",
                  color: "#fff",
                  fontWeight: 600,
                  background: active
                    ? "linear-gradient(135deg, rgba(20,184,166,0.45), rgba(14,165,233,0.35))"
                    : "transparent",
                  border: active
                    ? "1px solid rgba(45,212,191,0.5)"
                    : "1px solid transparent",
                  boxShadow: active ? "0 4px 16px rgba(20,184,166,0.2)" : "none",
                }}
              >
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: active ? item.color : "rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                  }}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={logout}
          style={{
            marginTop: "auto",
            padding: "12px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(239,68,68,0.2)",
            color: "#fecaca",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </aside>
    </>
  );
}
