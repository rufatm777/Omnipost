import { NextRequest, NextResponse } from "next/server";
import { publishToAll } from "@/lib/publisher";

export async function POST(req: NextRequest) {
  try {
    const { platforms, content, imageUrl, videoUrl } = await req.json();
    if (!platforms?.length || !content) return NextResponse.json({ error: "platforms and content required" }, { status: 400 });
    const results = await publishToAll(platforms, content, { imageUrl, videoUrl });
    const allOk = results.every(r => r.success);
    return NextResponse.json({ success: allOk, results });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
