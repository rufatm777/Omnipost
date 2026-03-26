import { NextRequest, NextResponse } from "next/server";
import { generateForAllPlatforms } from "@/lib/ai-generate";

export async function POST(req: NextRequest) {
  try {
    const { topic, tone, contentType, platforms } = await req.json();
    if (!topic || !platforms?.length) return NextResponse.json({ error: "topic and platforms required" }, { status: 400 });
    const content = await generateForAllPlatforms({ topic, tone: tone || "Professional", contentType: contentType || "Educational Post", platforms });
    return NextResponse.json({ content });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
