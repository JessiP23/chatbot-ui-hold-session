"use client";

import { useCallback, useRef, useState } from "react";

interface ReplyBoxProps {
  sessionId: string;
  disabled: boolean;
  onSend: (text: string) => void;
  onTyping: () => void;
}

const MAX_CHARS = 2000;

export default function ReplyBox({ sessionId, disabled, onSend, onTyping }: ReplyBoxProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const v = e.target.value.slice(0, MAX_CHARS);
      setValue(v);

      // Auto-resize
      const ta = textareaRef.current;
      if (ta) {
        ta.style.height = "auto";
        ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
      }

      // Throttled typing event — send at most once every 2s
      if (!typingTimerRef.current) {
        onTyping();
        typingTimerRef.current = setTimeout(() => {
          typingTimerRef.current = null;
        }, 2000);
      }
    },
    [onTyping]
  );

  const submit = useCallback(() => {
    const text = value.trim();
    if (!text || disabled || !sessionId) return;
    onSend(text);
    setValue("");
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [value, disabled, sessionId, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        submit();
      }
    },
    [submit]
  );

  const charPct = value.length / MAX_CHARS;
  const charColor = charPct > 0.9 ? "var(--danger)" : charPct > 0.7 ? "#F59E0B" : "var(--dim)";
  const isEmpty = !value.trim();
  const isDisabled = disabled || !sessionId;

  return (
    <div
      style={{
        flexShrink: 0,
        background: "var(--panel)",
        borderTop: "1px solid var(--edge)",
        padding: "12px 16px 16px",
      }}
    >
      {/* Char counter row */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
        <span style={{ fontSize: 9, color: charColor, fontVariantNumeric: "tabular-nums", letterSpacing: "0.05em" }}>
          {String(value.length).padStart(4, "0")}/{MAX_CHARS}
        </span>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        id="agent-reply-input"
        disabled={isDisabled}
        placeholder={isDisabled ? (sessionId ? "Connecting…" : "Select a session to reply") : "Type your reply… (Enter to send, Shift+Enter for newline)"}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        rows={2}
        style={{
          display: "block",
          width: "100%",
          boxSizing: "border-box",
          resize: "none",
          overflow: "hidden",
          background: isDisabled ? "var(--void)" : "var(--surface)",
          border: "1px solid var(--edge)",
          borderRadius: 6,
          padding: "10px 12px",
          color: "var(--text)",
          fontFamily: "inherit",
          fontSize: 13,
          lineHeight: 1.5,
          outline: "none",
          maxHeight: 160,
          transition: "border-color 0.2s, background 0.2s",
          opacity: isDisabled ? 0.5 : 1,
        }}
        onFocus={(e) => { if (!isDisabled) e.currentTarget.style.borderColor = "var(--accent)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "var(--edge)"; }}
      />

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
        <span style={{ fontSize: 9, color: "var(--dim)", letterSpacing: "0.06em" }}>
          SHIFT+↵ NEW LINE
        </span>
        <button
          id="agent-send-btn"
          onClick={submit}
          disabled={isDisabled || isEmpty}
          style={{
            all: "unset",
            cursor: isDisabled || isEmpty ? "not-allowed" : "pointer",
            background: isDisabled || isEmpty ? "var(--edge)" : "var(--accent)",
            color: isDisabled || isEmpty ? "var(--dim)" : "var(--void)",
            borderRadius: 5,
            padding: "5px 14px",
            fontSize: 9,
            fontWeight: 800,
            fontFamily: "inherit",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            transition: "background 0.2s, color 0.2s, opacity 0.2s",
          }}
          onMouseEnter={(e) => {
            if (!isDisabled && !isEmpty) e.currentTarget.style.opacity = "0.85";
          }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          SEND ↵
        </button>
      </div>
    </div>
  );
}
