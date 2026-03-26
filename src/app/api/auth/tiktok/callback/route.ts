import { NextRequest, NextResponse } from "next/server";
import { saveToken } from "@/lib/db/tokens";

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const storedState = req.cookies.get("tiktok_state")?.value;
  const codeVerifier = req.cookies.get("tiktok_verifier")?.value;

  if (!code || state !== storedState || !codeVerifier) {
    return NextResponse.redirect(`${appUrl}/settings?error=tiktok_auth_failed`);
  }

  try {
    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${appUrl}/api/auth/tiktok/callback`,
        code_verifier: codeVerifier,
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokens.access_token) {
      return NextResponse.redirect(`${appUrl}/settings?error=tiktok_token_failed`);
    }

    // Get user info
    const userRes = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url",
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );
    const user = await userRes.json();

    saveToken({
      platform: "tiktok",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_in ? Math.floor(Date.now() / 1000) + tokens.expires_in : undefined,
      account_name: user.data?.user?.display_name || "TikTok User",
      account_id: tokens.open_id,
    });

    const response = NextResponse.redirect(`${appUrl}/settings?connected=tiktok`);
    response.cookies.delete("tiktok_verifier");
    response.cookies.delete("tiktok_state");
    return response;
  } catch {
    return NextResponse.redirect(`${appUrl}/settings?error=tiktok_exception`);
  }
}
