# OmniPost v3 — Deploy to Netlify

AI social media manager with OAuth sign-in buttons. Self-owned, no middleman.

## Deploy to Netlify (Step by Step)

### Step 1: Push to GitHub

```bash
cd omnipost
git init
git add .
git commit -m "OmniPost v3"
git remote add origin https://github.com/YOUR-USERNAME/omnipost.git
git push -u origin main
```

### Step 2: Connect to Netlify

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Select **GitHub** → Choose your `omnipost` repo
4. Build settings (auto-detected):
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
5. Click **"Deploy site"**

### Step 3: Add Environment Variables

Go to **Site configuration → Environment variables** and add:

| Variable | Value |
|----------|-------|
| `ANTHROPIC_API_KEY` | Your Claude API key |
| `NEXT_PUBLIC_APP_URL` | `https://your-site-name.netlify.app` |
| `TWITTER_CLIENT_ID` | From developer.x.com |
| `TWITTER_CLIENT_SECRET` | From developer.x.com |
| `META_APP_ID` | From developers.facebook.com |
| `META_APP_SECRET` | From developers.facebook.com |
| `LINKEDIN_CLIENT_ID` | From linkedin.com/developers |
| `LINKEDIN_CLIENT_SECRET` | From linkedin.com/developers |
| `GOOGLE_CLIENT_ID` | From console.cloud.google.com |
| `GOOGLE_CLIENT_SECRET` | From console.cloud.google.com |
| `TELEGRAM_BOT_TOKEN` | From @BotFather |
| `TELEGRAM_CHANNEL_ID` | Your channel ID |

### Step 4: Update OAuth Callback URLs

In each platform's developer dashboard, update the callback URL to your Netlify domain:

| Platform | Callback URL |
|----------|-------------|
| Twitter | `https://your-site.netlify.app/api/auth/twitter/callback` |
| Meta | `https://your-site.netlify.app/api/auth/meta/callback` |
| LinkedIn | `https://your-site.netlify.app/api/auth/linkedin/callback` |
| Google | `https://your-site.netlify.app/api/auth/google/callback` |
| TikTok | `https://your-site.netlify.app/api/auth/tiktok/callback` |

### Step 5: Trigger Redeploy

After adding env vars, go to **Deploys** → **Trigger deploy** → **"Deploy site"**

### Step 6: Connect Your Accounts

Visit `https://your-site.netlify.app/settings` and click "Sign in" for each platform.

## Token Persistence on Netlify

OAuth tokens are saved to `data/tokens.json` on your server. On Netlify's serverless functions, this file resets between deploys. Two solutions:

### Option A: Connect locally first (recommended)
1. Run `npm run dev` locally
2. Connect all accounts at `localhost:3000/settings`
3. Copy the contents of `data/tokens.json`
4. Add as `OMNIPOST_TOKENS` env var in Netlify dashboard (paste as single-line JSON)
5. Redeploy

### Option B: Use Netlify Blobs (advanced)
Replace `src/lib/db/tokens.ts` with Netlify Blobs storage for fully persistent cloud storage. See [Netlify Blobs docs](https://docs.netlify.com/blobs/overview/).

## Architecture

```
src/
├── app/
│   ├── api/auth/          ← OAuth flows (Twitter, Meta, LinkedIn, Google, TikTok)
│   ├── api/generate/      ← Claude AI content generation
│   ├── api/publish/       ← Direct posting to all platforms
│   ├── api/accounts/      ← Connection status
│   ├── settings/page.tsx  ← "Sign in with..." buttons
│   └── page.tsx           ← Create + publish UI
├── lib/
│   ├── db/tokens.ts       ← Token storage (JSON + env var)
│   ├── publisher.ts       ← Unified posting router
│   ├── ai-generate.ts     ← Claude API prompts
│   └── platforms.ts       ← Platform configs
└── components/
    └── PlatformIcons.tsx
```

## Cost
- Netlify: Free (100GB bandwidth, 300 build minutes/month)
- Claude API: ~$5-20/month
- Platform APIs: All free
- **Total: ~$5-20/month**

## Custom Domain (optional)
1. In Netlify: **Domain management** → **Add custom domain**
2. Point your DNS to Netlify
3. Update `NEXT_PUBLIC_APP_URL` env var
4. Update all OAuth callback URLs in platform dashboards
