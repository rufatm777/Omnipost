import { NextRequest, NextResponse } from "next/server";
import { saveToken } from "@/lib/db/tokens";

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const storedState = req.cookies.get("linkedin_state")?.value;

  if (!code || state !== storedState) {
    return NextResponse.redirect(`${appUrl}/settings?error=linkedin_auth_failed`);
  }

  try {
    // Exchange code for token
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${appUrl}/api/auth/linkedin/callback`,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokens.access_token) {
      return NextResponse.redirect(`${appUrl}/settings?error=linkedin_token_failed`);
    }

    // Get user info
    const userRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const user = await userRes.json();

    saveToken({
      platform: "linkedin",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_in ? Math.floor(Date.now() / 1000) + tokens.expires_in : undefined,
      scope: tokens.scope,
      account_name: user.name || user.given_name || "LinkedIn User",
      account_id: user.sub ? `urn:li:person:${user.sub}` : undefined,
    });

    const response = NextResponse.redirect(`${appUrl}/settings?connected=linkedin`);
    response.cookies.delete("linkedin_state");
    return response;
  } catch {
    return NextResponse.redirect(`${appUrl}/settings?error=linkedin_exception`);
  }
}
