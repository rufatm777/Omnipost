// Meta OAuth callback — Exchange code, get long-lived token, detect pages + IG
import { NextRequest, NextResponse } from "next/server";
import { saveToken } from "@/lib/db/tokens";

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const storedState = req.cookies.get("meta_state")?.value;

  if (!code || state !== storedState) {
    return NextResponse.redirect(`${appUrl}/settings?error=meta_auth_failed`);
  }

  try {
    const appId = process.env.META_APP_ID!;
    const appSecret = process.env.META_APP_SECRET!;

    // Step 1: Exchange code for short-lived token
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
      return NextResponse.redirect(`${appUrl}/settings?error=meta_token_failed`);
    }

    // Step 2: Exchange for long-lived token (60 days)
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
    const longToken = longData.access_token || tokenData.access_token;
    const expiresIn = longData.expires_in || 5184000; // 60 days default

    // Step 3: Get user info
    const meRes = await fetch(`https://graph.facebook.com/v22.0/me?fields=name,id&access_token=${longToken}`);
    const me = await meRes.json();

    // Step 4: Get Pages (for Facebook posting + Instagram)
    const pagesRes = await fetch(
      `https://graph.facebook.com/v22.0/me/accounts?fields=name,access_token,id,instagram_business_account{id,username}&access_token=${longToken}`
    );
    const pagesData = await pagesRes.json();
    const page = pagesData.data?.[0]; // Use first page

    // Save Facebook token
    if (page) {
      saveToken({
        platform: "facebook",
        access_token: page.access_token, // Page token (never expires if from long-lived user token)
        expires_at: Math.floor(Date.now() / 1000) + expiresIn,
        account_name: page.name,
        account_id: page.id,
      });

      // Save Instagram token if business account exists
      if (page.instagram_business_account) {
        saveToken({
          platform: "instagram",
          access_token: page.access_token,
          expires_at: Math.floor(Date.now() / 1000) + expiresIn,
          account_name: page.instagram_business_account.username || page.name,
          account_id: page.instagram_business_account.id,
        });
      }
    }

    // Save Threads token (uses the user token)
    saveToken({
      platform: "threads",
      access_token: longToken,
      expires_at: Math.floor(Date.now() / 1000) + expiresIn,
      account_name: me.name,
      account_id: me.id,
    });

    const response = NextResponse.redirect(`${appUrl}/settings?connected=meta`);
    response.cookies.delete("meta_state");
    return response;
  } catch (err) {
    return NextResponse.redirect(`${appUrl}/settings?error=meta_exception`);
  }
}
