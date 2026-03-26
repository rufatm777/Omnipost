// Meta OAuth — Start authorization for Facebook + Instagram + Threads
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  const appId = process.env.META_APP_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  if (!appId) return NextResponse.json({ error: "META_APP_ID not set" }, { status: 500 });

  const state = crypto.randomBytes(16).toString("hex");
  const scopes = [
    "pages_show_list", "pages_manage_posts", "pages_read_engagement",
    "instagram_basic", "instagram_content_publish",
    "threads_basic", "threads_content_publish",
  ].join(",");

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: `${appUrl}/api/auth/meta/callback`,
    scope: scopes,
    response_type: "code",
    state,
  });

  const response = NextResponse.redirect(`https://www.facebook.com/v22.0/dialog/oauth?${params}`);
  response.cookies.set("meta_state", state, { httpOnly: true, maxAge: 600, path: "/" });
  return response;
}
