export interface Platform {
  name: string;
  color: string;
  gradient: string;
  maxChars: number;
  specs: string;
  authType: "oauth" | "bot" | "manual";
  authRoute?: string; // /api/auth/xxx
  setupUrl?: string;  // external dev portal
  setupNote?: string;
}

export const PLATFORMS: Record<string, Platform> = {
  twitter:   { name: "X / Twitter",  color: "#000000", gradient: "linear-gradient(135deg,#1a1a1a,#333)",          maxChars: 280,   specs: "280 chars. 3-5 hashtags.",                     authType: "oauth", authRoute: "/api/auth/twitter",   setupUrl: "https://developer.x.com/en/portal/dashboard" },
  facebook:  { name: "Facebook",     color: "#1877F2", gradient: "linear-gradient(135deg,#1877F2,#0C5DC7)",       maxChars: 63206, specs: "Image 1200×630. 2-5 hashtags.",                authType: "oauth", authRoute: "/api/auth/meta",      setupUrl: "https://developers.facebook.com/apps/" },
  instagram: { name: "Instagram",    color: "#E1306C", gradient: "linear-gradient(135deg,#833AB4,#E1306C,#F77737)", maxChars: 2200,  specs: "1080×1080. Up to 2,200 chars. Needs image.",   authType: "oauth", authRoute: "/api/auth/meta",      setupUrl: "https://developers.facebook.com/apps/", setupNote: "Connected via Meta (same as Facebook)" },
  linkedin:  { name: "LinkedIn",     color: "#0A66C2", gradient: "linear-gradient(135deg,#0A66C2,#004182)",       maxChars: 3000,  specs: "Up to 3,000 chars. 3-5 hashtags.",             authType: "oauth", authRoute: "/api/auth/linkedin",  setupUrl: "https://www.linkedin.com/developers/apps" },
  threads:   { name: "Threads",      color: "#000000", gradient: "linear-gradient(135deg,#000,#333)",             maxChars: 500,   specs: "500 chars. 1-2 hashtags.",                     authType: "oauth", authRoute: "/api/auth/meta",      setupUrl: "https://developers.facebook.com/apps/", setupNote: "Connected via Meta (same as Facebook)" },
  youtube:   { name: "YouTube",      color: "#FF0000", gradient: "linear-gradient(135deg,#FF0000,#CC0000)",       maxChars: 5000,  specs: "Title 100 chars. Description 5,000.",           authType: "oauth", authRoute: "/api/auth/google",    setupUrl: "https://console.cloud.google.com" },
  tiktok:    { name: "TikTok",       color: "#010101", gradient: "linear-gradient(135deg,#010101,#25F4EE,#FE2C55)", maxChars: 2200,  specs: "Video 9:16. Up to 2,200 chars.",               authType: "oauth", authRoute: "/api/auth/tiktok",    setupUrl: "https://developers.tiktok.com", setupNote: "Requires app review (~1-2 weeks)" },
  telegram:  { name: "Telegram",     color: "#26A5E4", gradient: "linear-gradient(135deg,#26A5E4,#0088CC)",       maxChars: 4096,  specs: "Up to 4,096 chars. Unlimited.",                 authType: "bot",   setupUrl: "https://t.me/BotFather", setupNote: "Uses Bot API — paste token in .env.local" },
};

export const TONES = ["Professional","Casual & Fun","Educational","Persuasive","Storytelling","Bold & Provocative","Inspirational","Humorous"];
export const CONTENT_TYPES = ["Product Launch","Educational Post","Behind the Scenes","User Testimonial","Industry News","Tips & Tricks","Event Promo","Thought Leadership","Engagement Post","Announcement"];
