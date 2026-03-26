import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  if (!clientKey) return NextResponse.json({ error: "TIKTOK_CLIENT_KEY not set" }, { status: 500 });

  const state = crypto.randomBytes(16).toString("hex");
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");

  const params = new URLSearchParams({
    client_key: clientKey,
    response_type: "code",
    scope: "user.info.basic,video.publish,video.upload",
    redirect_uri: `${appUrl}/api/auth/tiktok/callback`,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  const response = NextResponse.redirect(`https://www.tiktok.com/v2/auth/authorize/?${params}`);
  response.cookies.set("tiktok_verifier", codeVerifier, { httpOnly: true, maxAge: 600, path: "/" });
  response.cookies.set("tiktok_state", state, { httpOnly: true, maxAge: 600, path: "/" });
  return response;
}
