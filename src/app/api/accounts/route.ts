import { NextRequest, NextResponse } from "next/server";
import { getConnectedPlatforms, deleteToken } from "@/lib/db/tokens";

export async function GET() {
  const platforms = getConnectedPlatforms();
  return NextResponse.json({ platforms });
}

// DELETE /api/accounts?platform=twitter — disconnect a platform
export async function DELETE(req: NextRequest) {
  const platform = req.nextUrl.searchParams.get("platform");
  if (!platform) return NextResponse.json({ error: "platform required" }, { status: 400 });
  deleteToken(platform);
  return NextResponse.json({ success: true, disconnected: platform });
}
