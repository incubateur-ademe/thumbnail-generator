/**
 * Encode/decode presets for URL sharing.
 * Format: JSON → UTF-8 → base64 URL-safe (no padding).
 */

/** URLs beyond this length may be truncated by browsers or services. */
export const URL_LENGTH_WARNING = 8000;

export function encodePreset(state: Record<string, unknown>): string {
  const json = JSON.stringify(state);
  const encoded = btoa(unescape(encodeURIComponent(json)));
  return encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodePreset(str: string): Record<string, unknown> | null {
  try {
    let padded = str.replace(/-/g, "+").replace(/_/g, "/");
    while (padded.length % 4) padded += "=";
    const json = decodeURIComponent(escape(atob(padded)));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Parse hash fragment into mode and preset.
 * Format: #media-preview&p=abc123 or #thumbnail&p=abc123
 */
export function parseHash(hash: string): {
  mode: "thumbnail" | "media-preview" | null;
  preset: string | null;
} {
  const raw = hash.replace(/^#/, "");
  if (!raw) return { mode: null, preset: null };

  const [modeStr, ...rest] = raw.split("&");
  const mode =
    modeStr === "media-preview" || modeStr === "thumbnail" ? modeStr : null;

  let preset: string | null = null;
  for (const part of rest) {
    if (part.startsWith("p=")) {
      preset = decodeURIComponent(part.slice(2));
      break;
    }
  }

  return { mode, preset };
}

/** Build a hash string from mode and optional preset. */
export function buildHash(
  mode: "thumbnail" | "media-preview",
  preset?: string,
): string {
  let hash = `#${mode}`;
  if (preset) hash += `&p=${encodeURIComponent(preset)}`;
  return hash;
}
