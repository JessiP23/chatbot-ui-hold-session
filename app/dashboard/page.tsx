"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAgentSocket } from "./hooks/useAgentSocket";
import SessionCard from "./components/SessionCard";
import MessageThread from "./components/MessageThread";
import ReplyBox from "./components/ReplyBox";
import type { AgentStatus } from "./types";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "https://wm-chatbot-api.fly.dev/api/v1";

// ── Status helpers ────────────────────────────────────────────────────────────
const STATUS_DOT: Record<AgentStatus, string> = {
  connected:    "var(--online)",
  connecting:   "#F59E0B",
  disconnected: "var(--offline)",
  error:        "var(--danger)",
};

const STATUS_LABEL: Record<AgentStatus, string> = {
  connected:    "Online",
  connecting:   "Connecting…",
  disconnected: "Offline",
  error:        "Error",
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const socket = useAgentSocket();
  const { status, sessions, histories, sendReply, sendTyping, connect } = socket;

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [unread, setUnread] = useState<Record<string, number>>({});

  // ── Auto-connect on mount ────────────────────────────────────────────────
  useEffect(() => {
    connect(BACKEND_URL);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Track unread counts ───────────────────────────────────────────────────
  useEffect(() => {
    // When a new customer_message arrives, bump unread for sessions not active
    sessions.forEach((s) => {
      const msgs = histories[s.session_id] ?? [];
      const lastMsg = msgs[msgs.length - 1];
      if (!lastMsg) return;
      if (lastMsg.role === "user" && s.session_id !== activeSessionId) {
        setUnread((prev) => ({
          ...prev,
          [s.session_id]: (prev[s.session_id] ?? 0) + 1,
        }));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [histories]);

  function selectSession(sid: string) {
    setActiveSessionId(sid);
    setUnread((prev) => ({ ...prev, [sid]: 0 }));
  }

  // ── Reply ─────────────────────────────────────────────────────────────────
  const handleSend = useCallback(
    (text: string) => {
      if (!activeSessionId) return;
      sendReply(activeSessionId, text);
    },
    [activeSessionId, sendReply]
  );

  const handleTyping = useCallback(() => {
    if (!activeSessionId) return;
    sendTyping(activeSessionId);
  }, [activeSessionId, sendTyping]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      // Online first, then by most recent activity
      if (a.online !== b.online) return a.online ? -1 : 1;
      return (b.last_ts || b.created_at) - (a.last_ts || a.created_at);
    });
  }, [sessions]);

  const activeMessages = useMemo(() => {
    return activeSessionId ? (histories[activeSessionId] ?? []) : [];
  }, [activeSessionId, histories]);

  const activeSession = useMemo(() => {
    return sessions.find((s) => s.session_id === activeSessionId) ?? null;
  }, [sessions, activeSessionId]);

  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      overflow: "hidden",
      background: "var(--void)",
    }}>
        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <header style={{
          height: 52,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          background: "var(--panel)",
          borderBottom: "1px solid var(--edge)",
        }}>
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 5,
              background: "var(--surface)", border: "1px solid var(--edge)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 9, letterSpacing: "0.08em", color: "var(--accent)",
            }}>WM</div>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "var(--accent)", textTransform: "uppercase" }}>
              WM STUDIO
            </span>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "var(--dim)", textTransform: "uppercase" }}>
              / AGENT DASHBOARD
            </span>
          </div>

          {/* Right side: status */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Connection status */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: STATUS_DOT[status],
                boxShadow: status === "connected" ? "0 0 0 2px rgba(34,197,94,0.2)" : "none",
                animation: status === "connecting" ? "pulse 1s ease-in-out infinite" : "none",
                display: "inline-block",
              }} />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: "var(--dim)", textTransform: "uppercase" }}>
                {STATUS_LABEL[status]}
              </span>
            </div>

            {/* Session count */}
            <span style={{ fontSize: 9, color: "var(--dim)", letterSpacing: "0.08em" }}>
              {sessions.length} session{sessions.length !== 1 ? "s" : ""}
            </span>
          </div>
        </header>

        {/* ── Main split pane ───────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* ── Left: Sessions list ────────────────────────────────────────── */}
          <aside style={{
            width: 280,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid var(--edge)",
            background: "var(--panel)",
            overflow: "hidden",
          }}>
            {/* Sessions header */}
            <div style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--edge)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "var(--dim)", textTransform: "uppercase" }}>
                Sessions
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {totalUnread > 0 && (
                  <span style={{
                    background: "var(--accent)", color: "var(--void)",
                    fontSize: 9, fontWeight: 800, borderRadius: 999,
                    padding: "1px 7px", letterSpacing: "0.05em",
                  }}>
                    {totalUnread}
                  </span>
                )}
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
                  color: "var(--text)", background: "var(--surface)",
                  borderRadius: 4, padding: "2px 7px",
                }}>
                  {sessions.filter(s => s.online).length}/{sessions.length}
                </span>
              </div>
            </div>

            {/* Sessions list */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {status === "connecting" && sessions.length === 0 && (
                <div style={{
                  padding: 24, textAlign: "center",
                  color: "var(--dim)", fontSize: 11, letterSpacing: "0.08em",
                }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%",
                    border: "2px solid var(--edge)",
                    borderTopColor: "var(--accent)",
                    animation: "spin 0.8s linear infinite",
                    margin: "0 auto 12px",
                  }} />
                  Connecting…
                </div>
              )}

              {status === "connected" && sessions.length === 0 && (
                <div style={{
                  padding: 24, textAlign: "center",
                  color: "var(--dim)", fontSize: 11, letterSpacing: "0.08em",
                  lineHeight: 1.8,
                }}>
                  No active sessions yet.<br />Waiting for customers to connect.
                </div>
              )}

              {sortedSessions.map((session) => (
                <SessionCard
                  key={session.session_id}
                  session={session}
                  isActive={session.session_id === activeSessionId}
                  unreadCount={unread[session.session_id] ?? 0}
                  onClick={() => selectSession(session.session_id)}
                />
              ))}
            </div>
          </aside>

          {/* ── Right: Message thread + reply ─────────────────────────────── */}
          <main style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "var(--panel)",
          }}>
            {/* Thread header */}
            <div style={{
              height: 44,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 20px",
              borderBottom: "1px solid var(--edge)",
              background: "var(--panel)",
            }}>
              {activeSession ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                      background: activeSession.online ? "var(--online)" : "var(--offline)",
                      animation: activeSession.online ? "pulse 2s ease-in-out infinite" : "none",
                    }} />
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text)" }}>
                      SESSION {activeSession.session_id.replace(/^sess_/, "").slice(0, 16)}
                    </span>
                    <span style={{ fontSize: 9, color: "var(--dim)", letterSpacing: "0.06em" }}>
                      {activeSession.online ? "Customer online" : "Customer offline"}
                    </span>
                  </div>
                  <span style={{ fontSize: 9, color: "var(--dim)", letterSpacing: "0.06em" }}>
                    {activeMessages.length} messages
                  </span>
                </>
              ) : (
                <span style={{ fontSize: 9, color: "var(--dim)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                  No session selected
                </span>
              )}
            </div>

            {/* Messages */}
            <MessageThread
              sessionId={activeSessionId ?? ""}
              messages={activeMessages}
            />

            {/* Reply input */}
            <ReplyBox
              sessionId={activeSessionId ?? ""}
              disabled={status !== "connected"}
              onSend={handleSend}
              onTyping={handleTyping}
            />
          </main>
        </div>
      </div>
  );
}
