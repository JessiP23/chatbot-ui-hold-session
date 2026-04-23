"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AgentSocketState,
  AgentStatus,
  Message,
  SessionSummary,
} from "../types";

const PING_INTERVAL_MS = 20_000;
const INITIAL_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 30_000;

export function useAgentSocket(): AgentSocketState {
  const [status, setStatus] = useState<AgentStatus>("disconnected");
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [histories, setHistories] = useState<Record<string, Message[]>>({});

  const wsRef = useRef<WebSocket | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY_MS);
  const shouldReconnectRef = useRef(false);
  const connectParamsRef = useRef<{ backendUrl: string } | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const clearPing = () => {
    if (pingTimerRef.current) {
      clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
  };

  const clearReconnect = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  };

  const send = useCallback((payload: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  // ── Core connect ───────────────────────────────────────────────────────────
  const openSocket = useCallback((backendUrl: string) => {
    if (wsRef.current) {
      wsRef.current.onclose = null; // prevent reconnect loop on manual close
      wsRef.current.close();
      wsRef.current = null;
    }
    clearPing();
    clearReconnect();

    setStatus("connecting");

    // Convert http(s) → ws(s)
    const wsBase = backendUrl.replace(/^http/, "ws");
    const url = `${wsBase}/ws/agent`;

    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      setStatus("error");
      return;
    }

    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
      reconnectDelayRef.current = INITIAL_RECONNECT_DELAY_MS;
      pingTimerRef.current = setInterval(() => {
        send({ type: "ping" });
      }, PING_INTERVAL_MS);
    };

    ws.onmessage = (e: MessageEvent) => {
      try {
        handleMessage(JSON.parse(e.data as string));
      } catch {
        /* ignore parse errors */
      }
    };

    ws.onerror = () => {
      setStatus("error");
    };

    ws.onclose = () => {
      clearPing();
      wsRef.current = null;
      if (shouldReconnectRef.current && connectParamsRef.current) {
        setStatus("connecting");
        reconnectDelayRef.current = Math.min(
          reconnectDelayRef.current * 2,
          MAX_RECONNECT_DELAY_MS
        );
        reconnectTimerRef.current = setTimeout(() => {
          if (connectParamsRef.current) {
            openSocket(connectParamsRef.current.backendUrl);
          }
        }, reconnectDelayRef.current);
      } else {
        setStatus("disconnected");
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [send]);

  // ── Message handler ────────────────────────────────────────────────────────
  function handleMessage(data: Record<string, unknown>) {
    const type = data.type as string;

    if (type === "pong") return;

    if (type === "init") {
      // Full state on connect
      const rawSessions = (data.sessions as SessionSummary[]) ?? [];
      const rawHistories = (data.history as Record<string, Message[]>) ?? {};
      setSessions(rawSessions);
      setHistories(rawHistories);
      return;
    }

    if (type === "session_update") {
      const session = data.session as SessionSummary;
      setSessions((prev) => {
        const idx = prev.findIndex((s) => s.session_id === session.session_id);
        if (idx === -1) return [...prev, session];
        const next = [...prev];
        next[idx] = session;
        return next;
      });
      return;
    }

    if (type === "customer_message") {
      const sid = data.session_id as string;
      const msg: Message = {
        role: "user",
        text: data.text as string,
        ts: data.ts as number,
      };
      setHistories((prev) => ({
        ...prev,
        [sid]: [...(prev[sid] ?? []), msg],
      }));
      // Also update session summary if included
      if (data.session) {
        const session = data.session as SessionSummary;
        setSessions((prev) => {
          const idx = prev.findIndex((s) => s.session_id === session.session_id);
          if (idx === -1) return [...prev, session];
          const next = [...prev];
          next[idx] = session;
          return next;
        });
      }
      return;
    }

    if (type === "agent_reply_echo") {
      const sid = data.session_id as string;
      const msg: Message = {
        role: "assistant",
        text: data.text as string,
        ts: data.ts as number,
      };
      setHistories((prev) => ({
        ...prev,
        [sid]: [...(prev[sid] ?? []), msg],
      }));
      return;
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  const connect = useCallback(
    (backendUrl: string) => {
      connectParamsRef.current = { backendUrl };
      shouldReconnectRef.current = true;
      openSocket(backendUrl);
    },
    [openSocket]
  );

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    connectParamsRef.current = null;
    clearPing();
    clearReconnect();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus("disconnected");
  }, []);

  const sendReply = useCallback(
    (sessionId: string, text: string) => {
      send({ type: "agent_reply", session_id: sessionId, text });
    },
    [send]
  );

  const sendTyping = useCallback(
    (sessionId: string) => {
      send({ type: "typing", session_id: sessionId });
    },
    [send]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldReconnectRef.current = false;
      clearPing();
      clearReconnect();
      wsRef.current?.close();
    };
  }, []);

  return { status, sessions, histories, sendReply, sendTyping, connect, disconnect };
}
