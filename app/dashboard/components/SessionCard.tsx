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
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function SessionCard({ session, isActive, unreadCount, onClick }: SessionCardProps) {
  const shortId = session.session_id.replace(/^sess_/, "").slice(0, 12);
  const isLive = session.status === "active" && session.online;
  const isClosed = session.status === "closed";

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
        borderLeft: `2px solid ${isActive ? "var(--accent)" : isLive ? "var(--online)" : "transparent"}`,
        background: isActive ? "var(--surface)" : "transparent",
        borderBottom: "1px solid var(--edge)",
        transition: "background 0.15s ease, border-color 0.15s ease",
        animation: "slideIn 0.2s cubic-bezier(0.16,1,0.3,1)",
        opacity: isClosed && !isActive ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = "rgba(28,28,31,0.6)";
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = "transparent";
      }}
    >
      {/* Top row: status + ID + badges */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          {/* Online/status indicator */}
          <span
            title={isLive ? "Customer online" : isClosed ? "Session closed" : "Customer offline"}
            style={{
              width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
              background: isLive ? "var(--online)" : isClosed ? "var(--offline)" : "#F59E0B",
              boxShadow: isLive ? "0 0 0 2px rgba(34,197,94,0.25)" : "none",
              animation: isLive ? "pulse 2s ease-in-out infinite" : "none",
            }}
          />
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
            color: isActive ? "var(--accent)" : "var(--text)",
            fontFamily: "inherit",
          }}>
            {shortId}
          </span>
          {/* Status badge */}
          <span style={{
            fontSize: 8, fontWeight: 800, letterSpacing: "0.12em",
            textTransform: "uppercase",
            padding: "1px 5px", borderRadius: 3,
            background: isLive ? "rgba(34,197,94,0.15)" : isClosed ? "rgba(90,90,98,0.15)" : "rgba(245,158,11,0.15)",
            color: isLive ? "var(--online)" : isClosed ? "var(--dim)" : "#F59E0B",
          }}>
            {isLive ? "LIVE" : isClosed ? "CLOSED" : "AWAY"}
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
          {timeAgo(session.last_ts || session.created_at)}
        </span>
      </div>
    </button>
  );
}
