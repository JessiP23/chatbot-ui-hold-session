"use client";

import { useEffect, useRef } from "react";
import type { Message } from "../types";

interface MessageThreadProps {
  sessionId: string;
  messages: Message[];
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function parseMarkdownBasic(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br/>");
}

export default function MessageThread({ sessionId, messages }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!sessionId) {
    return (
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--dim)", fontSize: 12, letterSpacing: "0.1em",
        flexDirection: "column", gap: 12,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 8,
          border: "1px solid var(--edge)", display: "flex",
          alignItems: "center", justifyContent: "center",
          fontSize: 20,
        }}>💬</div>
        <span>SELECT A SESSION TO VIEW MESSAGES</span>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--dim)", fontSize: 11, letterSpacing: "0.1em",
      }}>
        NO MESSAGES YET — WAITING FOR CUSTOMER
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      id="message-thread"
      style={{
        flex: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        background: "var(--panel)",
      }}
    >
      {messages.map((msg, i) => {
        const isUser = msg.role === "user";
        const isFirst = i === 0;
        return (
          <div key={`${msg.ts}-${i}`}>
            {/* Separator between messages */}
            {!isFirst && (
              <div style={{ height: 1, background: "var(--edge)", flexShrink: 0 }} />
            )}
            <div
              style={{
                padding: "13px 20px",
                borderLeft: `2px solid ${isUser ? "var(--edge)" : "var(--accent)"}`,
                background: "transparent",
                transition: "background 0.15s ease",
                animation: "fadeIn 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {/* Role label */}
              <div style={{
                fontSize: 8, fontWeight: 700, letterSpacing: "0.22em",
                color: isUser ? "var(--dim)" : "var(--accent)",
                textTransform: "uppercase", marginBottom: 5,
              }}>
                {isUser ? "Customer" : "Agent"}
              </div>

              {/* Message body */}
              {isUser ? (
                <div style={{
                  fontSize: 13, color: "var(--text)",
                  lineHeight: 1.6, wordBreak: "break-word",
                }}>
                  {msg.text}
                </div>
              ) : (
                <div
                  style={{
                    fontSize: 13, color: "var(--text)",
                    lineHeight: 1.7, wordBreak: "break-word",
                  }}
                  dangerouslySetInnerHTML={{ __html: parseMarkdownBasic(msg.text) }}
                />
              )}

              {/* Timestamp */}
              <div style={{
                marginTop: 6, fontSize: 10, color: "var(--dim)",
                display: "flex", justifyContent: isUser ? "flex-end" : "flex-start",
              }}>
                {formatTime(msg.ts)}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} style={{ height: 1, flexShrink: 0 }} />
    </div>
  );
}
