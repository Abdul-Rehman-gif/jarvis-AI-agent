/**
 * Independent guardrails checked on the server BEFORE any command is
 * forwarded to the desktop agent. These do not trust the LLM's judgment -
 * they re-check the actual params against hard rules.
 *
 * Both functions return `null` when the action is allowed, or a short
 * human-readable reason string when it should be blocked.
 */

// Only these roots may ever be targeted by delete / create_folder actions.
// Edit this list for your own machine - keep it narrow. Anything outside
// these roots (System32, Windows, Program Files, drive roots, etc.) is
// refused outright, regardless of what the AI or user asked for.
const ALLOWED_FILE_ROOTS = [
  "documents\\jarvis-sandbox",
  "downloads\\jarvis-sandbox",
  "desktop\\jarvis-sandbox",
];

// Absolute no-go path fragments, checked in addition to the allowlist above.
const BLOCKED_PATH_FRAGMENTS = [
  "windows",
  "system32",
  "program files",
  "programdata",
  "\\users\\" /* catches other users' profiles when combined with allowlist */,
];

export function isPathSafe(rawPath: string): string | null {
  if (!rawPath || typeof rawPath !== "string") return "no path provided";

  const normalized = rawPath.toLowerCase().replace(/\//g, "\\").trim();

  // Reject path traversal and drive-root style paths outright.
  if (normalized.includes("..")) return "path traversal ('..') is not allowed";
  if (/^[a-z]:\\?$/.test(normalized)) return "refusing to target an entire drive root";

  const withinAllowedRoot = ALLOWED_FILE_ROOTS.some((root) => normalized.includes(root));
  if (!withinAllowedRoot) {
    return `path is outside the allowed sandbox folders (${ALLOWED_FILE_ROOTS.join(", ")})`;
  }

  const hitBlocked = BLOCKED_PATH_FRAGMENTS.find((frag) => normalized.includes(frag) && !normalized.includes("jarvis-sandbox"));
  if (hitBlocked) return `path touches a protected system location ("${hitBlocked}")`;

  return null;
}

// Keyword denylist for PowerShell. This is intentionally simple and NOT a
// substitute for not running arbitrary scripts at all - it just catches the
// most common destructive patterns before they reach the agent.
const BLOCKED_SCRIPT_PATTERNS: RegExp[] = [
  /remove-item/i,
  /rm\s+-r/i,
  /del\s+\/[fsq]/i,
  /format-volume/i,
  /shutdown/i,
  /restart-computer/i,
  /stop-computer/i,
  /net\s+user/i,
  /disable-.*firewall/i,
  /invoke-webrequest/i,
  /invoke-expression/i,
  /iex\s/i,
  /downloadstring/i,
  /new-object\s+net\.webclient/i,
  /reg\s+(add|delete)/i,
  /vssadmin/i,
  /bcdedit/i,
  /takeown/i,
  /icacls/i,
];

export function isScriptSafe(script: string): string | null {
  if (!script || typeof script !== "string") return "no script provided";
  if (script.length > 500) return "script exceeds max allowed length (500 chars) - break it down or run it manually";

  for (const pattern of BLOCKED_SCRIPT_PATTERNS) {
    if (pattern.test(script)) {
      return `matched blocked pattern (${pattern})`;
    }
  }

  return null;
}
