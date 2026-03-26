// Twitter OAuth 2.0 with PKCE — Start authorization
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  if (!clientId) return NextResponse.json({ error: "TWITTER_CLIENT_ID not set" }, { status: 500 });

  // Generate PKCE code verifier and challenge
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
  const state = crypto.randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: `${appUrl}/api/auth/twitter/callback`,
    scope: "tweet.read tweet.write users.read offline.access",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  // Store verifier in cookie for callback
  const response = NextResponse.redirect(`https://twitter.com/i/oauth2/authorize?${params}`);
  response.cookies.set("twitter_code_verifier", codeVerifier, { httpOnly: true, maxAge: 600, path: "/" });
  response.cookies.set("twitter_state", state, { httpOnly: true, maxAge: 600, path: "/" });
  return response;
}
