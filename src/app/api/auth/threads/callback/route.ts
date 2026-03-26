// Threads OAuth callback — exchanges code for Threads access token
// Saves the real Threads user ID (not a Facebook user ID)
import { NextRequest, NextResponse } from "next/server";
import { saveToken } from "@/lib/db/tokens";

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const storedState = req.cookies.get("threads_state")?.value;

  if (!code || state !== storedState) {
    console.error("[threads/callback] State mismatch or missing code");
    return NextResponse.redirect(`${appUrl}/settings?error=threads_auth_failed`);
  }

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    console.error("[threads/callback] META_APP_ID or META_APP_SECRET not set");
    return NextResponse.redirect(`${appUrl}/settings?error=threads_config_missing`);
  }

  try {
    // Step 1: Exchange code for short-lived Threads token
    const tokenRes = await fetch(
      "https://graph.threads.net/oauth/access_token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: appId,
          client_secret: appSecret,
          grant_type: "authorization_code",
          redirect_uri: `${appUrl}/api/auth/threads/callback`,
          code,
        }),
      }
    );
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error("[threads/callback] Token exchange failed:", tokenData);
      return NextResponse.redirect(`${appUrl}/settings?error=threads_token_failed`);
    }

    const shortToken = tokenData.access_token;
    const threadsUserId = tokenData.user_id; // This is the REAL Threads user ID

    // Step 2: Exchange for long-lived token (60 days)
    const longRes = await fetch(
      `https://graph.threads.net/access_token?` +
        new URLSearchParams({
          grant_type: "th_exchange_token",
          client_secret: appSecret,
          access_token: shortToken,
        })
    );
    const longData = await longRes.json();
    const longToken = longData.access_token || shortToken;
    const expiresIn = longData.expires_in || 5184000;

    // Step 3: Get Threads user profile
    const profileRes = await fetch(
      `https://graph.threads.net/v1.0/me?fields=id,username,threads_profile_picture_url&access_token=${longToken}`
    );
    const profile = await profileRes.json();

    const accountName = profile.username || `Threads User ${threadsUserId}`;
    const accountId = profile.id || String(threadsUserId);

    saveToken({
      platform: "threads",
      access_token: longToken,
      expires_at: Math.floor(Date.now() / 1000) + expiresIn,
      account_name: accountName,
      account_id: accountId,
    });
    console.log(`[threads/callback] Threads connected: ${accountName} (${accountId})`);

    const response = NextResponse.redirect(`${appUrl}/settings?connected=threads`);
    response.cookies.delete("threads_state");
    return response;
  } catch (err) {
    console.error("[threads/callback] Exception:", err);
    return NextResponse.redirect(`${appUrl}/settings?error=threads_exception`);
  }
}
