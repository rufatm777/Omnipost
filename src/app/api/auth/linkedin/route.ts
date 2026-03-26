import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  if (!clientId) return NextResponse.json({ error: "LINKEDIN_CLIENT_ID not set" }, { status: 500 });

  const state = crypto.randomBytes(16).toString("hex");
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: `${appUrl}/api/auth/linkedin/callback`,
    scope: "openid profile w_member_social",
    state,
  });

  const response = NextResponse.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params}`);
  response.cookies.set("linkedin_state", state, { httpOnly: true, maxAge: 600, path: "/" });
  return response;
}
