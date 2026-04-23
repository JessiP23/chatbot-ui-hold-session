"use client";

import type { SessionSummary } from "../types";

interface SessionCardProps {
  session: SessionSummary;
  isActive: boolean;
  unreadCount: number;
  onClick: () => void;
}

function timeAgo(ms: number): string {
  if (!ms) return "—";
  const diff = Math.floor((Date.now() - ms) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function SessionCard({ session, isActive, unreadCount, onClick }: SessionCardProps) {
  const shortId = session.session_id.replace(/^sess_/, "").slice(0, 12);

  return (
    <button
      id={`session-card-${session.session_id}`}
      onClick={onClick}
      title={`Session ${session.session_id}`}
      style={{
        all: "unset",
        display: "block",
        width: "100%",
        cursor: "pointer",
        padding: "14px 16px",
        borderLeft: `2px solid ${isActive ? "var(--accent)" : "transparent"}`,
        background: isActive ? "var(--surface)" : "transparent",
        borderBottom: "1px solid var(--edge)",
        transition: "background 0.15s ease, border-color 0.15s ease",
        animation: "slideIn 0.2s cubic-bezier(0.16,1,0.3,1)",
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = "rgba(28,28,31,0.6)";
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = "transparent";
      }}
    >
      {/* Top row: status + ID + unread badge */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          {/* Online indicator */}
          <span
            title={session.online ? "Customer online" : "Customer offline"}
            style={{
              width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
              background: session.online ? "var(--online)" : "var(--offline)",
              boxShadow: session.online ? "0 0 0 2px rgba(34,197,94,0.25)" : "none",
              animation: session.online ? "pulse 2s ease-in-out infinite" : "none",
            }}
          />
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
            color: isActive ? "var(--accent)" : "var(--text)",
            fontFamily: "inherit",
          }}>
            {shortId}
          </span>
        </div>
        {unreadCount > 0 && (
          <span style={{
            background: "var(--accent)", color: "var(--void)",
            fontSize: 9, fontWeight: 800, borderRadius: 999,
            padding: "1px 6px", letterSpacing: "0.05em",
          }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>

      {/* Last message preview */}
      <div style={{
        fontSize: 11, color: "var(--dim)",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        maxWidth: "100%", lineHeight: 1.4,
      }}>
        {session.last_role === "user" && <span style={{ color: "var(--text)", marginRight: 4 }}>↗</span>}
        {session.last_text || "No messages yet"}
      </div>

      {/* Footer: count + time */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: 9, color: "var(--dim)", letterSpacing: "0.08em" }}>
          {session.message_count} {session.message_count === 1 ? "msg" : "msgs"}
        </span>
        <span style={{ fontSize: 9, color: "var(--dim)", letterSpacing: "0.06em" }}>
          {timeAgo(session.last_ts)}
        </span>
      </div>
    </button>
  );
}
