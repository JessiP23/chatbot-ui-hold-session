"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("Client: Form submitted, attempting login..."); // CLIENT-SIDE DEBUG LOG
    setError("");
    setLoading(true);

    try {
      // 1. Submit credentials (without CSRF token)
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await loginRes.json();

      if (!loginRes.ok) {
        setAttempts((n) => n + 1);
        setError(data.error ?? "Login failed.");
        return;
      }

      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const blocked = attempts >= 5;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0C0C0E",
        fontFamily: '"Geist Mono", "Courier New", monospace',
      }}
    >
      {/* Subtle grid background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(249,115,22,0.03) 1px, transparent 1px), " +
            "linear-gradient(90deg, rgba(249,115,22,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 380,
          padding: "0 20px",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36 }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: 7,
              background: "#141416", border: "1px solid #2A2A2E",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 11, letterSpacing: "0.08em", color: "#f97316",
            }}
          >
            WM
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", color: "#f97316", textTransform: "uppercase" }}>
              WM Studio
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", color: "#5A5A62", textTransform: "uppercase" }}>
              Agent Dashboard
            </div>
          </div>
        </div>

        {/* Card */}
        <div style={{ background: "#141416", border: "1px solid #2A2A2E", borderRadius: 10, padding: "28px 24px" }}>
          <h1 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", color: "#E8E8EC" }}>
            SIGN IN
          </h1>
          <p style={{ margin: "0 0 24px", fontSize: 10, color: "#5A5A62", letterSpacing: "0.06em" }}>
            Authorized agents only.
          </p>

          {/* Error banner */}
          {error && (
            <div
              style={{
                marginBottom: 16, padding: "9px 12px",
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 6, fontSize: 10, color: "#f87171", letterSpacing: "0.05em",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <label style={{ display: "block", fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", color: "#5A5A62", textTransform: "uppercase", marginBottom: 5 }}>
              Username
            </label>
            <input
              ref={usernameRef}
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading || blocked}
              required
              style={{
                display: "block", width: "100%", boxSizing: "border-box",
                padding: "9px 12px", marginBottom: 16,
                background: "#1C1C1F", border: "1px solid #2A2A2E", borderRadius: 6,
                color: "#E8E8EC", fontSize: 13, fontFamily: "inherit", outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#f97316")}
              onBlur={(e) => (e.target.style.borderColor = "#2A2A2E")}
            />

            <label style={{ display: "block", fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", color: "#5A5A62", textTransform: "uppercase", marginBottom: 5 }}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || blocked}
              required
              style={{
                display: "block", width: "100%", boxSizing: "border-box",
                padding: "9px 12px", marginBottom: 24,
                background: "#1C1C1F", border: "1px solid #2A2A2E", borderRadius: 6,
                color: "#E8E8EC", fontSize: 13, fontFamily: "inherit", outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#f97316")}
              onBlur={(e) => (e.target.style.borderColor = "#2A2A2E")}
            />

            <button
              type="submit"
              disabled={loading || blocked || !username || !password}
              style={{
                width: "100%", padding: "10px 0",
                background: loading || blocked || !username || !password ? "#2A2A2E" : "#f97316",
                color: loading || blocked || !username || !password ? "#5A5A62" : "#0C0C0E",
                border: "none", borderRadius: 6,
                fontSize: 10, fontWeight: 800, letterSpacing: "0.18em",
                textTransform: "uppercase", fontFamily: "inherit",
                cursor: loading || blocked || !username || !password ? "not-allowed" : "pointer",
                transition: "background 0.2s ease, color 0.2s ease",
              }}
            >
              {loading ? "VERIFYING…" : blocked ? "LOCKED" : "SIGN IN →"}
            </button>
          </form>
        </div>

        <p style={{ marginTop: 20, textAlign: "center", fontSize: 9, color: "#2A2A2E", letterSpacing: "0.08em" }}>
          WM STUDIO · RESTRICTED ACCESS
        </p>
      </div>
    </div>
  );
}

// ── Page wrapper — Suspense required by Next.js for useSearchParams ───────────
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}