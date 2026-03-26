// Meta OAuth callback — saves Facebook Page + Instagram tokens
// Does NOT save Threads. Threads has its own auth flow.
import { NextRequest, NextResponse } from "next/server";
import { saveToken } from "@/lib/db/tokens";

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const storedState = req.cookies.get("meta_state")?.value;

  if (!code || state !== storedState) {
    console.error("[meta/callback] State mismatch or missing code");
    return NextResponse.redirect(`${appUrl}/settings?error=meta_auth_failed`);
  }

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    console.error("[meta/callback] META_APP_ID or META_APP_SECRET not set");
    return NextResponse.redirect(`${appUrl}/settings?error=meta_config_missing`);
  }

  try {
    // Step 1: Exchange code for short-lived user token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v22.0/oauth/access_token?` +
        new URLSearchParams({
          client_id: appId,
          client_secret: appSecret,
          redirect_uri: `${appUrl}/api/auth/meta/callback`,
          code,
        })
    );
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error("[meta/callback] Token exchange failed:", tokenData);
      return NextResponse.redirect(`${appUrl}/settings?error=meta_token_failed`);
    }

    // Step 2: Exchange for long-lived user token (60 days)
    const longRes = await fetch(
      `https://graph.facebook.com/v22.0/oauth/access_token?` +
        new URLSearchParams({
          grant_type: "fb_exchange_token",
          client_id: appId,
          client_secret: appSecret,
          fb_exchange_token: tokenData.access_token,
        })
    );
    const longData = await longRes.json();
    const userToken = longData.access_token || tokenData.access_token;
    const expiresIn = longData.expires_in || 5184000;

    // Step 3: Get Pages with Instagram business accounts
    const pagesRes = await fetch(
      `https://graph.facebook.com/v22.0/me/accounts?` +
        `fields=name,access_token,id,instagram_business_account{id,username}` +
        `&access_token=${userToken}`
    );
    const pagesData = await pagesRes.json();

    if (!pagesData.data?.length) {
      console.error("[meta/callback] No Pages found. User needs a Facebook Page.");
      return NextResponse.redirect(`${appUrl}/settings?error=meta_no_pages`);
    }

    const page = pagesData.data[0];
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

    // Save Facebook Page token
    // Page tokens derived from long-lived user tokens don't expire
    saveToken({
      platform: "facebook",
      access_token: page.access_token,
      expires_at: expiresAt,
      account_name: page.name,
      account_id: page.id,
    });
    console.log(`[meta/callback] Facebook connected: ${page.name} (${page.id})`);

    // Save Instagram token if a business account is linked to the Page
    if (page.instagram_business_account) {
      saveToken({
        platform: "instagram",
        access_token: page.access_token,
        expires_at: expiresAt,
        account_name:
          page.instagram_business_account.username || page.name,
        account_id: page.instagram_business_account.id,
      });
      console.log(
        `[meta/callback] Instagram connected: ${page.instagram_business_account.username || page.name} (${page.instagram_business_account.id})`
      );
    } else {
      console.log(
        "[meta/callback] No Instagram Business account linked to this Page. Instagram not connected."
      );
    }

    const response = NextResponse.redirect(`${appUrl}/settings?connected=meta`);
    response.cookies.delete("meta_state");
    return response;
  } catch (err) {
    console.error("[meta/callback] Exception:", err);
    return NextResponse.redirect(`${appUrl}/settings?error=meta_exception`);
  }
}
