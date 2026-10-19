"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuditorSidebar from "./auditor-sidebar";
import type { SessionUser } from "@/lib/types";

export default function AuditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => {
        if (!r.ok) {
          router.push("/login");
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (d?.user) {
          if (d.user.role !== "auditor" && d.user.role !== "admin") {
            router.push("/");
            return;
          }
          setUser(d.user);
        }
        setReady(true);
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  if (!ready || !user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--muted)",
          background: "linear-gradient(160deg, #f0fdfa 0%, #f8fafc 40%, #eef2ff 100%)",
        }}
      >
        Loading…
      </div>
    );
  }

  const staffLabel = user.fullName || user.username || "Auditor";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #f0fdfa 0%, #f8fafc 40%, #eef2ff 100%)",
      }}
    >
      <AuditorSidebar staffLabel={staffLabel} />
      <main style={{ minHeight: "calc(100vh - 64px)", paddingBottom: 24 }}>
        {children}
      </main>
    </div>
  );
}
