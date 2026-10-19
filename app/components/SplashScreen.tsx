"use client";

import { useEffect, useState } from "react";

const SPLASH_MS = 10_000; // 10 seconds

/**
 * Full-screen Union TMS logo splash on first app open / hard refresh.
 * Shows for 10 seconds, then reveals the app.
 */
export default function SplashScreen({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Optional: skip splash if already shown this browser session
    // Comment out these 4 lines if you ALWAYS want 10s on every visit
    try {
      if (sessionStorage.getItem("union_tms_splash_done") === "1") {
        setShow(false);
        return;
      }
    } catch {
      // ignore
    }

    const fadeTimer = setTimeout(() => setFadeOut(true), SPLASH_MS - 500);
    const hideTimer = setTimeout(() => {
      setShow(false);
      try {
        sessionStorage.setItem("union_tms_splash_done", "1");
      } catch {
        // ignore
      }
    }, SPLASH_MS);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <>
      {show && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#0f172a",
            transition: "opacity 0.5s ease",
            opacity: fadeOut ? 0 : 1,
            pointerEvents: fadeOut ? "none" : "auto",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/splash-logo.png"
            alt="Union TMS"
            width={220}
            height={220}
            style={{
              width: "min(55vw, 220px)",
              height: "auto",
              borderRadius: 28,
              boxShadow: "0 0 48px rgba(20, 184, 166, 0.35)",
            }}
          />
          <p
            style={{
              marginTop: "1.5rem",
              color: "#94a3b8",
              fontSize: "0.9rem",
              fontWeight: 500,
              letterSpacing: "0.04em",
            }}
          >
            Loading…
          </p>
        </div>
      )}
      {children}
    </>
  );
}
