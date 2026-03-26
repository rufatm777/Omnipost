// =====================================================
// Token storage — Netlify-compatible
// Local dev: JSON file (data/tokens.json)
// Production: OMNIPOST_TOKENS env var (JSON string)
//
// After OAuth, tokens persist via the JSON file locally.
// On Netlify, use the dashboard to set OMNIPOST_TOKENS
// or use Netlify Blobs (see README).
// =====================================================

import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const TOKENS_FILE = path.join(DATA_DIR, "tokens.json");

export interface StoredToken {
  platform: string;
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_at?: number;
  scope?: string;
  account_name?: string;
  account_id?: string;
}

function readAll(): Record<string, StoredToken> {
  // 1. Check env var first (Netlify production)
  const env = process.env.OMNIPOST_TOKENS;
  if (env) { try { return JSON.parse(env); } catch { /* fall through */ } }

  // 2. Read from JSON file (local dev / self-hosted)
  try {
    if (fs.existsSync(TOKENS_FILE)) {
      return JSON.parse(fs.readFileSync(TOKENS_FILE, "utf-8"));
    }
  } catch { /* fall through */ }

  return {};
}

function writeAll(tokens: Record<string, StoredToken>): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
  } catch (e) {
    console.error("Token write failed:", e);
  }
}

export function saveToken(token: StoredToken): void {
  const all = readAll();
  all[token.platform] = token;
  writeAll(all);
}

export function getToken(platform: string): StoredToken | null {
  return readAll()[platform] || null;
}

export function deleteToken(platform: string): void {
  const all = readAll();
  delete all[platform];
  writeAll(all);
}

export function getConnectedPlatforms(): Record<string, { connected: boolean; accountName?: string }> {
  const all = readAll();
  const result: Record<string, { connected: boolean; accountName?: string }> = {};

  for (const [k, t] of Object.entries(all)) {
    const expired = t.expires_at ? t.expires_at < Math.floor(Date.now() / 1000) : false;
    result[k] = { connected: !expired, accountName: t.account_name };
  }

  // Telegram (env-based, no OAuth)
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHANNEL_ID) {
    result.telegram = { connected: true, accountName: "Bot" };
  }

  return result;
}
