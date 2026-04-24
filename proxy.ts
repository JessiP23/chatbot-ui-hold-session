import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "./lib/session";

export const config = {
  matcher: ["/dashboard/:path*"],
};

export async function proxy(req: NextRequest) {
  console.log("Debug (proxy.ts): Proxy function hit for path:", req.nextUrl.pathname); // DEBUG LOG
  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(req, res, sessionOptions);

  console.log("Debug (proxy.ts): Session user logged in:", session.user?.loggedIn); // DEBUG LOG

  if (!session.user?.loggedIn) {
    console.log("Debug (proxy.ts): User not logged in, redirecting to /login"); // DEBUG LOG
    return NextResponse.redirect(new URL("/login", req.url));
  }

  console.log("Debug (proxy.ts): User logged in, proceeding to dashboard"); // DEBUG LOG
  return res;
}