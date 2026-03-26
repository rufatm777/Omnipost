// Twitter OAuth 2.0 callback — Exchange code for tokens
import { NextRequest, NextResponse } from "next/server";
import { saveToken } from "@/lib/db/tokens";

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const storedState = req.cookies.get("twitter_state")?.value;
  const codeVerifier = req.cookies.get("twitter_code_verifier")?.value;

  if (!code || !codeVerifier || state !== storedState) {
    return NextResponse.redirect(`${appUrl}/settings?error=twitter_auth_failed`);
  }

  try {
    const clientId = process.env.TWITTER_CLIENT_ID!;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET!;
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        redirect_uri: `${appUrl}/api/auth/twitter/callback`,
        code_verifier: codeVerifier,
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokens.access_token) {
      return NextResponse.redirect(`${appUrl}/settings?error=twitter_token_failed`);
    }

    // Get user info
    const userRes = await fetch("https://api.twitter.com/2/users/me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const user = await userRes.json();

    saveToken({
      platform: "twitter",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_in ? Math.floor(Date.now() / 1000) + tokens.expires_in : undefined,
      scope: tokens.scope,
      account_name: `@${user.data?.username || "unknown"}`,
      account_id: user.data?.id,
    });

    const response = NextResponse.redirect(`${appUrl}/settings?connected=twitter`);
    response.cookies.delete("twitter_code_verifier");
    response.cookies.delete("twitter_state");
    return response;
  } catch (err) {
    return NextResponse.redirect(`${appUrl}/settings?error=twitter_exception`);
  }
}
