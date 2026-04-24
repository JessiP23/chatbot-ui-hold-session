import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";
import { loginSchema, validateCredentials } from "@/lib/auth";

// ── Simple in-memory rate limiter ────────────────────────────────────────────
// Keyed by IP: max 5 attempts per 15-minute window.
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = attempts.get(ip);
  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  record.count += 1;
  return record.count > MAX_ATTEMPTS;
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  console.log("Debug: Login API route hit."); // SERVER-SIDE DEBUG LOG
  // 1. Rate limit by IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "127.0.0.1";
  if (checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in 15 minutes." },
      { status: 429 }
    );
  }

  // 2. Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  // 3. Zod validation
  const parsed = loginSchema.safeParse(body);
  console.log("Debug: Zod validation complete. Success:", parsed.success); // SERVER-SIDE DEBUG LOG
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { username, password } = parsed.data;

  // 4. Read session via next/headers cookies (App Router pattern)
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  console.log("Debug: Session retrieved. User logged in:", session.user?.loggedIn); // SERVER-SIDE DEBUG LOG

  // 5. Validate credentials (bcrypt)
  const valid = await validateCredentials(username, password);
  console.log("Debug: validateCredentials called. Result:", valid); // SERVER-SIDE DEBUG LOG
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid credentials." },
      { status: 401 }
    );
  }

  // 6. Set authenticated user
  session.user = { username, loggedIn: true };
  await session.save();

  return NextResponse.json({ ok: true });
}