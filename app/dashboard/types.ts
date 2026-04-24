// ── Domain types shared across the Agent Dashboard ───────────────────────────

export interface SessionSummary {
  session_id: string;
  created_at: number;   // unix ms
  message_count: number;
  last_text: string;    // first 80 chars of last message
  last_role: "user" | "assistant" | "";
  last_ts: number;      // unix ms of last message
  online: boolean;      // customer WebSocket still open
  status: "active" | "closed";
}

export interface Message {
  role: "user" | "assistant";
  text: string;
  ts: number; // unix ms
}

export type AgentStatus = "disconnected" | "connecting" | "connected" | "error";

export interface AgentSocketState {
  status: AgentStatus;
  sessions: SessionSummary[];
  histories: Record<string, Message[]>;
  sendReply: (sessionId: string, text: string) => void;
  sendTyping: (sessionId: string) => void;
  connect: (backendUrl: string) => void;
  disconnect: () => void;
}
