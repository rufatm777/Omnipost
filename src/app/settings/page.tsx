"use client";
import { useState, useEffect } from "react";
import { PLATFORMS } from "@/lib/platforms";
import { PlatformIcon } from "@/components/PlatformIcons";
import Link from "next/link";

interface AccountInfo { connected: boolean; accountName?: string }

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<Record<string, AccountInfo>>({});
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/accounts")
      .then(r => r.json())
      .then(d => { setAccounts(d.platforms || {}); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const disconnect = async (platform: string) => {
    setDisconnecting(platform);
    await fetch(`/api/accounts?platform=${platform}`, { method: "DELETE" });
    setAccounts(prev => { const n = { ...prev }; delete n[platform]; return n; });
    setDisconnecting(null);
  };

  const connectedCount = Object.values(accounts).filter(a => a.connected).length;

  return (
    <div style={{ minHeight: "100vh", fontFamily: "var(--f)" }}>
      <header style={{ padding: "20px 28px", borderBottom: "1px solid var(--bd)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--ac)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2L15 8.5L22 9.5L17 14.5L18 21.5L12 18L6 21.5L7 14.5L2 9.5L9 8.5L12 2Z" fill="var(--bg)"/></svg>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: "var(--fs)", letterSpacing: "-0.5px" }}>Omni<span style={{ fontWeight: 400, color: "var(--tx2)" }}>Post</span></h1>
        </div>
        <Link href="/" style={{ padding: "9px 20px", borderRadius: 12, background: "var(--ac)", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to create
        </Link>
      </header>

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "40px 28px 80px" }}>
        <h2 style={{ fontFamily: "var(--fs)", fontSize: 30, fontWeight: 800, marginBottom: 8 }}>Connected accounts</h2>
        <p style={{ color: "var(--tx2)", fontSize: 14.5, marginBottom: 8, lineHeight: 1.6 }}>
          Sign in to each platform to connect it. Each platform requires its own authorization.
        </p>
        <p style={{ color: "var(--ok)", fontSize: 13, fontWeight: 700, marginBottom: 36 }}>
          {connectedCount} of {Object.keys(PLATFORMS).length} connected
        </p>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--tx3)" }}>Loading accounts...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Object.entries(PLATFORMS).map(([key, p]) => {
              const acc = accounts[key];
              const connected = acc?.connected;

              return (
                <div key={key} style={{
                  display: "flex", alignItems: "center", gap: 16,
                  padding: "18px 22px", borderRadius: 18,
                  border: connected ? `2px solid ${p.color}25` : "1.5px solid var(--bd)",
                  background: connected ? `${p.color}04` : "var(--bg2)",
                  transition: "all .25s",
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: connected ? `${p.color}15` : "var(--bg3)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <PlatformIcon platform={key} size={24} color={connected ? p.color : "var(--tx3)"} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 15.5, fontWeight: 700 }}>{p.name}</span>
                      {p.setupNote && !connected && (
                        <span style={{ fontSize: 10, color: "var(--tx3)", fontWeight: 500 }}>{p.setupNote}</span>
                      )}
                    </div>
                    {connected ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--ok)" }} />
                        <span style={{ fontSize: 13, color: "var(--ok)", fontWeight: 600 }}>
                          {acc?.accountName || "Connected"}
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 13, color: "var(--tx3)" }}>{p.specs.split(".")[0]}</span>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    {connected ? (
                      <button
                        onClick={() => disconnect(key)}
                        disabled={disconnecting === key}
                        style={{
                          padding: "9px 18px", borderRadius: 12,
                          border: "1.5px solid var(--bd)", background: "transparent",
                          color: "var(--tx2)", fontSize: 13, fontWeight: 700,
                          cursor: "pointer", opacity: disconnecting === key ? 0.5 : 1,
                        }}
                      >
                        {disconnecting === key ? "..." : "Disconnect"}
                      </button>
                    ) : p.authType === "oauth" ? (
                      <a
                        href={p.authRoute}
                        style={{
                          padding: "10px 22px", borderRadius: 12,
                          border: "none", background: p.color, color: "#fff",
                          fontSize: 13, fontWeight: 700, textDecoration: "none",
                          display: "flex", alignItems: "center", gap: 7,
                          cursor: "pointer", whiteSpace: "nowrap",
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/>
                        </svg>
                        Sign in
                      </a>
                    ) : (
                      <a
                        href={p.setupUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: "10px 22px", borderRadius: 12,
                          border: `1.5px solid ${p.color}`, background: "transparent",
                          color: p.color, fontSize: 13, fontWeight: 700,
                          textDecoration: "none", whiteSpace: "nowrap",
                        }}
                      >
                        Setup guide
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* How it works */}
        <div style={{ marginTop: 32, padding: "20px 24px", borderRadius: 16, background: "var(--bg3)", border: "1px solid var(--bd)" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--tx)", marginBottom: 8 }}>How it works</p>
          <div style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.7 }}>
            <p style={{ marginBottom: 8 }}>When you click <strong>Sign in</strong>, you are redirected to the platform's official login page. After you authorize, a token is sent back to OmniPost. This is standard OAuth — the same flow used by Buffer, Hootsuite, and Repurpose.io.</p>
            <p style={{ marginBottom: 8 }}>Your tokens are stored in a local file (<code style={{ background: "var(--bg)", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>data/tokens.json</code>) on your server. No credentials are sent to any third party.</p>
            <p>To enable sign-in buttons, register a developer app on each platform and add the app credentials to your environment variables. This is a one-time setup per platform.</p>
          </div>
        </div>

        {/* Setup order */}
        <div style={{ marginTop: 24, padding: "20px 24px", borderRadius: 16, background: "var(--bg2)", border: "1px solid var(--bd)" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--tx)", marginBottom: 12 }}>Setup order (fastest first)</p>
          {[
            { n: "1. Telegram", t: "2 min", d: "Message @BotFather, create bot, paste token in env vars" },
            { n: "2. X / Twitter", t: "10 min", d: "Create app at developer.x.com, enable OAuth 2.0" },
            { n: "3. Facebook + Instagram", t: "20 min", d: "Create Meta app. One sign-in connects both if IG is linked to your Page." },
            { n: "4. Threads", t: "5 min", d: "Uses the same Meta app, but requires a separate sign-in." },
            { n: "5. LinkedIn", t: "15 min", d: "Create app at linkedin.com/developers, verify company page" },
            { n: "6. YouTube", t: "15 min", d: "Create project in Google Cloud, enable YouTube Data API v3" },
            { n: "7. TikTok", t: "1-2 weeks", d: "Create app at developers.tiktok.com, submit for review" },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < 6 ? "1px solid var(--bd)" : "none" }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "var(--ok)", minWidth: 55 }}>{s.t}</span>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>{s.n}</div>
                <div style={{ fontSize: 12.5, color: "var(--tx2)" }}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
