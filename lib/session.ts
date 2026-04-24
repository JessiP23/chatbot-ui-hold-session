import type { SessionOptions } from "iron-session";

export interface SessionData {
  user?: {
    username: string;
    loggedIn: true;
  };
}

/** iron-session config — SESSION_SECRET must be >= 32 chars */
export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "wm_agent_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "strict",
    maxAge: 8 * 60 * 60, // 8-hour session
  },
};