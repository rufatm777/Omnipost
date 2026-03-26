// =====================================================
// Unified publisher — reads tokens from DB, posts to APIs
// =====================================================

import { getToken } from "./db/tokens";

export interface PublishResult {
  platform: string;
  success: boolean;
  postId?: string;
  error?: string;
}

async function postTwitter(content: string): Promise<PublishResult> {
  const t = getToken("twitter");
  if (!t) return { platform: "twitter", success: false, error: "Not connected" };

  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: { Authorization: `Bearer ${t.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text: content }),
  });
  const data = await res.json();
  if (data.data?.id) return { platform: "twitter", success: true, postId: data.data.id };
  return { platform: "twitter", success: false, error: data.detail || data.title || JSON.stringify(data.errors || data) };
}

async function postFacebook(content: string, imageUrl?: string): Promise<PublishResult> {
  const t = getToken("facebook");
  if (!t) return { platform: "facebook", success: false, error: "Not connected" };

  const endpoint = imageUrl
    ? `https://graph.facebook.com/v22.0/${t.account_id}/photos`
    : `https://graph.facebook.com/v22.0/${t.account_id}/feed`;
  const body = imageUrl
    ? { url: imageUrl, caption: content, access_token: t.access_token }
    : { message: content, access_token: t.access_token };

  const res = await fetch(endpoint, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.id) return { platform: "facebook", success: true, postId: data.id };
  return { platform: "facebook", success: false, error: data.error?.message || "Post failed" };
}

async function postInstagram(content: string, imageUrl?: string): Promise<PublishResult> {
  const t = getToken("instagram");
  if (!t) return { platform: "instagram", success: false, error: "Not connected" };
  if (!imageUrl) return { platform: "instagram", success: false, error: "Instagram requires an image URL" };

  // Create container
  const cRes = await fetch(`https://graph.facebook.com/v22.0/${t.account_id}/media`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl, caption: content, access_token: t.access_token }),
  });
  const container = await cRes.json();
  if (!container.id) return { platform: "instagram", success: false, error: container.error?.message || "Container failed" };

  // Wait for processing
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const sRes = await fetch(`https://graph.facebook.com/v22.0/${container.id}?fields=status_code&access_token=${t.access_token}`);
    const s = await sRes.json();
    if (s.status_code === "FINISHED") break;
    if (s.status_code === "ERROR") return { platform: "instagram", success: false, error: "Media processing failed" };
  }

  // Publish
  const pRes = await fetch(`https://graph.facebook.com/v22.0/${t.account_id}/media_publish`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: container.id, access_token: t.access_token }),
  });
  const pub = await pRes.json();
  if (pub.id) return { platform: "instagram", success: true, postId: pub.id };
  return { platform: "instagram", success: false, error: pub.error?.message || "Publish failed" };
}

async function postLinkedIn(content: string): Promise<PublishResult> {
  const t = getToken("linkedin");
  if (!t) return { platform: "linkedin", success: false, error: "Not connected" };

  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: { Authorization: `Bearer ${t.access_token}`, "Content-Type": "application/json", "X-Restli-Protocol-Version": "2.0.0" },
    body: JSON.stringify({
      author: t.account_id,
      lifecycleState: "PUBLISHED",
      specificContent: { "com.linkedin.ugc.ShareContent": { shareCommentary: { text: content }, shareMediaCategory: "NONE" } },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });
  if (res.status === 201) return { platform: "linkedin", success: true, postId: res.headers.get("x-restli-id") || "ok" };
  const data = await res.json();
  return { platform: "linkedin", success: false, error: data.message || "Post failed" };
}

async function postTelegram(content: string, imageUrl?: string): Promise<PublishResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.TELEGRAM_CHANNEL_ID;
  if (!botToken || !channelId) return { platform: "telegram", success: false, error: "Not configured" };

  const endpoint = imageUrl ? "sendPhoto" : "sendMessage";
  const body = imageUrl
    ? { chat_id: channelId, photo: imageUrl, caption: content, parse_mode: "HTML" }
    : { chat_id: channelId, text: content, parse_mode: "HTML" };

  const res = await fetch(`https://api.telegram.org/bot${botToken}/${endpoint}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.ok) return { platform: "telegram", success: true, postId: String(data.result.message_id) };
  return { platform: "telegram", success: false, error: data.description || "Failed" };
}

async function postThreads(content: string, imageUrl?: string): Promise<PublishResult> {
  const t = getToken("threads");
  if (!t) return { platform: "threads", success: false, error: "Not connected" };

  const containerBody: any = { text: content, media_type: imageUrl ? "IMAGE" : "TEXT", access_token: t.access_token };
  if (imageUrl) containerBody.image_url = imageUrl;

  const cRes = await fetch(`https://graph.threads.net/v1.0/${t.account_id}/threads`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(containerBody),
  });
  const container = await cRes.json();
  if (!container.id) return { platform: "threads", success: false, error: container.error?.message || "Failed" };

  const pRes = await fetch(`https://graph.threads.net/v1.0/${t.account_id}/threads_publish`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: container.id, access_token: t.access_token }),
  });
  const pub = await pRes.json();
  if (pub.id) return { platform: "threads", success: true, postId: pub.id };
  return { platform: "threads", success: false, error: pub.error?.message || "Failed" };
}

async function postTikTok(content: string, videoUrl?: string): Promise<PublishResult> {
  const t = getToken("tiktok");
  if (!t) return { platform: "tiktok", success: false, error: "Not connected" };
  if (!videoUrl) return { platform: "tiktok", success: false, error: "TikTok requires a video URL" };

  const res = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST",
    headers: { Authorization: `Bearer ${t.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      post_info: { title: content, privacy_level: "PUBLIC_TO_EVERYONE" },
      source_info: { source: "PULL_FROM_URL", video_url: videoUrl },
    }),
  });
  const data = await res.json();
  if (data.data?.publish_id) return { platform: "tiktok", success: true, postId: data.data.publish_id };
  return { platform: "tiktok", success: false, error: data.error?.message || "Upload failed" };
}

async function postYouTube(_content: string): Promise<PublishResult> {
  return { platform: "youtube", success: false, error: "YouTube requires video upload — use a separate workflow" };
}

const POSTERS: Record<string, (content: string, imageUrl?: string, videoUrl?: string) => Promise<PublishResult>> = {
  twitter: (c) => postTwitter(c),
  facebook: (c, img) => postFacebook(c, img),
  instagram: (c, img) => postInstagram(c, img),
  linkedin: (c) => postLinkedIn(c),
  telegram: (c, img) => postTelegram(c, img),
  threads: (c, img) => postThreads(c, img),
  tiktok: (c, _img, vid) => postTikTok(c, vid),
  youtube: (c) => postYouTube(c),
};

export async function publishToAll(
  platforms: string[],
  content: Record<string, string>,
  options?: { imageUrl?: string; videoUrl?: string }
): Promise<PublishResult[]> {
  const results = await Promise.allSettled(
    platforms.map(p => {
      const fn = POSTERS[p];
      if (!fn) return Promise.resolve({ platform: p, success: false, error: "Unknown platform" } as PublishResult);
      return fn(content[p] || "", options?.imageUrl, options?.videoUrl);
    })
  );
  return results.map((r, i) =>
    r.status === "fulfilled" ? r.value : { platform: platforms[i], success: false, error: r.reason?.message }
  );
}
