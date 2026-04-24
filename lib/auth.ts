import { z } from "zod";
import bcrypt from "bcryptjs";

/** Zod schema — validates and sanitises the login form body */
export const loginSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .max(64, "Username too long")
    .trim(),
  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password too long"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Validate credentials against the env-var fallback identity.
 * Uses bcrypt comparison so the hash is never stored in plain text.\'\'\'
 */
export async function validateCredentials(
  username: string,
  password: string
): Promise<boolean> {
  const validUsername = process.env.AGENT_USERNAME;
  const validHash = process.env.AGENT_PASSWORD_HASH;

  console.log("Debug (auth.ts): AGENT_USERNAME =", validUsername); // SERVER-SIDE DEBUG LOG
  console.log("Debug (auth.ts): AGENT_PASSWORD_HASH =", validHash); // SERVER-SIDE DEBUG LOG

  if (!validUsername || !validHash) {
    console.error("[Auth] AGENT_USERNAME / AGENT_PASSWORD_HASH not set");
    return false;
  }

  // Constant-time string comparison for username prevents timing attacks
  if (username.length !== validUsername.length) return false;
  let usernameMismatch = 0;
  for (let i = 0; i < username.length; i++) {
    usernameMismatch |= username.charCodeAt(i) ^ validUsername.charCodeAt(i);
  }
  if (usernameMismatch !== 0) return false;

  return bcrypt.compare(password, validHash);
}