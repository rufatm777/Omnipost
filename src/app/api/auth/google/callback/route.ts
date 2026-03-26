import { NextRequest, NextResponse } from "next/server";
import { saveToken } from "@/lib/db/tokens";

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const storedState = req.cookies.get("google_state")?.value;

  if (!code || state !== storedState) {
    return NextResponse.redirect(`${appUrl}/settings?error=google_auth_failed`);
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${appUrl}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokens.access_token) {
      return NextResponse.redirect(`${appUrl}/settings?error=google_token_failed`);
    }

    // Get user profile
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const user = await userRes.json();

    // Get YouTube channel
    const ytRes = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );
    const ytData = await ytRes.json();
    const channel = ytData.items?.[0];

    saveToken({
      platform: "youtube",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_in ? Math.floor(Date.now() / 1000) + tokens.expires_in : undefined,
      account_name: channel?.snippet?.title || user.name || "YouTube",
      account_id: channel?.id,
    });

    const response = NextResponse.redirect(`${appUrl}/settings?connected=youtube`);
    response.cookies.delete("google_state");
    return response;
  } catch {
    return NextResponse.redirect(`${appUrl}/settings?error=google_exception`);
  }
}
