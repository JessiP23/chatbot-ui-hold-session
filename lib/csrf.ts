/**
 * CSRF utilities — uses Web Crypto (works on both Node.js and Edge runtime).
 * Token is generated per-login-page-load, stored in the encrypted iron-session,
 * and verified on submission with a constant-time compare.
 */

/** Generate a cryptographically random 64-hex-char CSRF token */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Constant-time CSRF token comparison.
 * Both tokens must be the same length and character-for-character equal.
 */
export function verifyCsrfToken(
  submitted: string,
  stored: string
): boolean {
  if (!submitted || !stored) return false;
  if (submitted.length !== stored.length) return false;

  let mismatch = 0;
  for (let i = 0; i < submitted.length; i++) {
    mismatch |= submitted.charCodeAt(i) ^ stored.charCodeAt(i);
  }
  return mismatch === 0;
}
