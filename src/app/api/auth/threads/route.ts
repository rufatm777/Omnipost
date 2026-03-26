// Threads OAuth — separate from Facebook/Instagram
// Uses Threads-specific OAuth endpoint and scopes
// Docs: https://developers.facebook.com/docs/threads/get-started
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  const appId = process.env.META_APP_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!appId) {
    console.error("[threads/auth] META_APP_ID not set");
    return NextResponse.json(
      { error: "META_APP_ID not set. Threads uses the same Meta app, but requires a separate sign-in." },
      { status: 500 }
    );
  }

  const state = crypto.randomBytes(16).toString("hex");

  // Threads has its OWN OAuth endpoint and its own scopes
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: `${appUrl}/api/auth/threads/callback`,
    scope: "threads_basic,threads_content_publish",
    response_type: "code",
    state,
  });

  const response = NextResponse.redirect(
    `https://threads.net/oauth/authorize?${params}`
  );
  response.cookies.set("threads_state", state, {
    httpOnly: true,
    maxAge: 600,
    path: "/",
    sameSite: "lax",
  });
  return response;
}
