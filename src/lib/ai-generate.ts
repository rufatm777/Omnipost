import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) { const k = process.env.ANTHROPIC_API_KEY; if (!k) throw new Error("ANTHROPIC_API_KEY not set"); client = new Anthropic({ apiKey: k }); }
  return client;
}

const RULES: Record<string, string> = {
  instagram: "Instagram: Max 2,200 chars. Visual, engaging. Up to 30 hashtags at end. Line breaks for readability. CTA.",
  twitter: "X/Twitter: STRICT 280 char limit including hashtags. Punchy, sharp. 2-3 hashtags max.",
  linkedin: "LinkedIn: Up to 3,000 chars. Professional but human. Strong hook first 2 lines. 3-5 hashtags at end.",
  facebook: "Facebook: Conversational, warm. Longer form OK. 2-5 hashtags. Storytelling works well.",
  tiktok: "TikTok: Max 2,200 chars. Trendy, fast language. 8-10 hashtags. Video description style.",
  youtube: "YouTube: Line 1 = TITLE (under 100 chars). Blank line. DESCRIPTION (up to 5,000 chars). 5-10 hashtags.",
  telegram: "Telegram: Up to 4,096 chars. Direct, detailed. HTML formatting supported.",
  threads: "Threads: STRICT 500 char limit. Conversational, authentic. 1-2 hashtags max.",
};

export async function generateForAllPlatforms(p: { topic: string; tone: string; contentType: string; platforms: string[] }): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  const api = getClient();
  await Promise.all(p.platforms.map(async (plat) => {
    const msg = await api.messages.create({
      model: "claude-sonnet-4-20250514", max_tokens: 1024,
      system: "You are an expert social media writer. Output ONLY the post. No explanations, no markdown. Human tone, never generic. Strong hook first line.",
      messages: [{ role: "user", content: `Write a ${plat} post.\n\nTopic: ${p.topic}\nTone: ${p.tone}\nType: ${p.contentType}\n\n${RULES[plat] || RULES.facebook}\n\nWrite the post now:` }],
    });
    results[plat] = (msg.content.find(b => b.type === "text") as any)?.text?.trim() || "";
  }));
  return results;
}
