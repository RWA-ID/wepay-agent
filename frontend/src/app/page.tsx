"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { FlipWords } from "@/components/FlipWords";
import { useTheme } from "@/lib/theme";

// ── Icons ──────────────────────────────────────────────────────────────────

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

function TelegramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#2AABEE"/>
      <path d="M5.2 11.6 17.4 7c.6-.2 1.1.1.9.8l-2 9.4c-.1.6-.5.7-.9.5l-2.8-2-1.3 1.3c-.2.2-.4.2-.5 0l-.4-2.6-4.2-1.3c-.6-.2-.6-.6.2-.9z" fill="white"/>
      <path d="M9.4 15.9l.2-3 5.4-4.9c.2-.2 0-.3-.3-.1L7.6 13.2l-2.4-.8" fill="#C8DAEA"/>
    </svg>
  );
}

// ── Telegram conversation data ─────────────────────────────────────────────

const messages = [
  { from: "user",  text: "Pay my electric bill $87" },
  { from: "agent", text: "✓ Charged $87.00 to your\nVisa virtual card 🟠\nConEd · Apr 13" },
  { from: "user",  text: "Pay rent on the 1st" },
  { from: "agent", text: "✓ $1,200 USDC scheduled\nApr 1 → landlord.eth" },
  { from: "user",  text: "What's my balance?" },
  { from: "agent", text: "💰 842.60 USDC on Base\n💳 Virtual card: active\n\nFund: name.wepay.eth" },
];

// ── CSS iPhone mockup ──────────────────────────────────────────────────────

function IPhoneMockup() {
  return (
    <div style={{ position: "relative", width: "260px", flexShrink: 0 }}>
      {/* Glow behind phone */}
      <div style={{
        position: "absolute", inset: "-30px",
        background: "radial-gradient(ellipse at 50% 55%, rgba(0,102,255,0.22) 0%, transparent 65%)",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* Phone shell */}
      <div style={{
        position: "relative", zIndex: 1,
        width: "260px",
        background: "linear-gradient(170deg, #323234 0%, #1C1C1E 55%, #141416 100%)",
        borderRadius: "46px",
        padding: "9px",
        boxShadow: [
          "inset 0 0 0 0.5px rgba(255,255,255,0.13)",
          "0 0 0 1px rgba(0,0,0,0.9)",
          "0 6px 12px rgba(0,0,0,0.6)",
          "0 24px 72px rgba(0,0,0,0.55)",
          "0 0 80px rgba(0,102,255,0.18)",
        ].join(", "),
      }}>
        {/* Left buttons */}
        <div style={{ position: "absolute", left: "-3px", top: "96px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ width: "3px", height: "28px", background: "#3A3A3C", borderRadius: "2px 0 0 2px" }} />
          <div style={{ width: "3px", height: "44px", background: "#3A3A3C", borderRadius: "2px 0 0 2px" }} />
          <div style={{ width: "3px", height: "44px", background: "#3A3A3C", borderRadius: "2px 0 0 2px" }} />
        </div>
        {/* Right button */}
        <div style={{ position: "absolute", right: "-3px", top: "130px", width: "3px", height: "68px", background: "#3A3A3C", borderRadius: "0 2px 2px 0" }} />

        {/* Screen */}
        <div style={{
          borderRadius: "38px",
          overflow: "hidden",
          background: "#EFEFF4",
          height: "514px",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}>
          {/* Dynamic Island */}
          <div style={{
            position: "absolute",
            top: "10px", left: "50%", transform: "translateX(-50%)",
            width: "90px", height: "28px",
            background: "#000", borderRadius: "20px",
            zIndex: 10,
          }} />

          {/* Status bar */}
          <div style={{
            height: "50px", flexShrink: 0,
            display: "flex", alignItems: "flex-end", justifyContent: "space-between",
            padding: "0 20px 8px",
            background: "#FFFFFF",
          }}>
            <span style={{ fontSize: "11px", fontWeight: 600, fontFamily: "-apple-system, sans-serif", color: "#000" }}>9:41</span>
            <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
              {/* Signal bars */}
              <svg width="16" height="10" viewBox="0 0 16 10">
                <rect x="0" y="4" width="3" height="6" rx="0.5" fill="#000"/>
                <rect x="4.5" y="2.5" width="3" height="7.5" rx="0.5" fill="#000"/>
                <rect x="9" y="1" width="3" height="9" rx="0.5" fill="#000"/>
                <rect x="13.5" y="0" width="2.5" height="10" rx="0.5" fill="#000"/>
              </svg>
              {/* Battery */}
              <div style={{ display: "flex", alignItems: "center", gap: "1px" }}>
                <div style={{ width: "22px", height: "11px", border: "1.5px solid rgba(0,0,0,0.35)", borderRadius: "3px", padding: "1.5px" }}>
                  <div style={{ width: "72%", height: "100%", background: "#000", borderRadius: "1.5px" }} />
                </div>
                <div style={{ width: "2px", height: "5px", background: "rgba(0,0,0,0.35)", borderRadius: "0 1px 1px 0" }} />
              </div>
            </div>
          </div>

          {/* Telegram header */}
          <div style={{
            padding: "8px 12px 8px",
            background: "#FFFFFF",
            borderBottom: "0.5px solid rgba(0,0,0,0.1)",
            display: "flex", alignItems: "center", gap: "8px",
            flexShrink: 0,
          }}>
            <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
              <path d="M8.5 1.5L2 8l6.5 6.5" stroke="#2AABEE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg,#0066FF 0%,#00C48C 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", flexShrink: 0 }}>💸</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#000", lineHeight: 1.2, fontFamily: "-apple-system, sans-serif" }}>WePay Agent</p>
              <p style={{ fontSize: "10px", color: "#34C759", lineHeight: 1 }}>online</p>
            </div>
            <TelegramIcon size={18} />
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: "8px", display: "flex", flexDirection: "column", gap: "5px", overflowY: "hidden", background: "#EFEFF4" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.from === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "78%", padding: "6px 9px",
                  borderRadius: msg.from === "user" ? "14px 14px 3px 14px" : "14px 14px 14px 3px",
                  background: msg.from === "user" ? "#2AABEE" : "#FFFFFF",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                  color: msg.from === "user" ? "#FFF" : "#000",
                  fontSize: "10px", lineHeight: 1.45, whiteSpace: "pre-line",
                  fontFamily: "-apple-system, sans-serif",
                }}>{msg.text}</div>
              </div>
            ))}
          </div>

          {/* Input bar */}
          <div style={{ padding: "6px 8px", background: "#FFFFFF", borderTop: "0.5px solid rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
            <div style={{ flex: 1, background: "#EFEFF4", borderRadius: "18px", padding: "5px 10px", fontSize: "10px", color: "#999", fontFamily: "-apple-system, sans-serif" }}>Message</div>
            <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#2AABEE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </div>
          </div>

          {/* Home indicator */}
          <div style={{ height: "20px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#FFFFFF" }}>
            <div style={{ width: "100px", height: "4px", background: "#000", borderRadius: "99px", opacity: 0.18 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Landing page ───────────────────────────────────────────────────────────

const flipWords = ["Rent", "Cards", "Utilities", "Subscriptions", "Everything!"];

export default function LandingPage() {
  const { isConnected } = useAccount();
  const { theme, toggle } = useTheme();
  const router = useRouter();

  // As soon as wallet connects, send to onboarding
  useEffect(() => {
    if (isConnected) {
      router.push("/onboard/");
    }
  }, [isConnected, router]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* ── Nav ───────────────────────────────────────────────────────── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 32px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg)",
        backdropFilter: "blur(12px)",
      }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "20px", color: "var(--text)", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>💸</span> WePay
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={toggle} aria-label="Toggle theme" style={{ padding: "8px", background: "var(--bg-3)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", color: "var(--text-2)", cursor: "pointer", display: "flex", alignItems: "center" }}>
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          <ConnectButton accountStatus="avatar" chainStatus="none" showBalance={false} label="Connect Wallet" />
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section style={{
        maxWidth: "1100px", margin: "0 auto",
        padding: "72px 32px 64px",
        display: "grid", gridTemplateColumns: "1fr auto",
        gap: "64px", alignItems: "center",
      }}>
        {/* Left — copy + CTA */}
        <div style={{ minWidth: 0 }}>
          <div className="badge badge-green fade-up" style={{ marginBottom: "24px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
            Non-custodial · ENS-native · AI-powered
          </div>

          <h1 className="fade-up-1" style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(40px, 6vw, 72px)",
            fontWeight: 800, lineHeight: 1.05,
            letterSpacing: "-0.03em",
            color: "var(--text)", marginBottom: "24px",
            display: "flex", flexDirection: "column", gap: "4px",
          }}>
            <span>Text WePay Agent To Pay</span>
            <span style={{ display: "inline-block", minHeight: "1.1em" }}>
              <FlipWords words={flipWords} duration={2800} className="gradient-text" />
            </span>
          </h1>

          <p className="fade-up-2" style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "var(--text-2)", lineHeight: 1.7, maxWidth: "500px", marginBottom: "20px" }}>
            Your personal AI agent pays bills from anywhere, anytime —
            just send a quick message on{" "}
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", verticalAlign: "middle" }}>
              <TelegramIcon size={16} /> Telegram.
            </span>
            {" "}No app. No login. No hassle.
          </p>

          <div className="fade-up-2" style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "28px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "10px 16px", background: "var(--blue-dim)", border: "1px solid rgba(0,102,255,0.2)", borderRadius: "var(--r-md)" }}>
              <span style={{ fontSize: "18px" }}>🌐</span>
              <p style={{ fontSize: "13px", color: "var(--text-2)", lineHeight: 1.5 }}>
                You get{" "}
                <strong style={{ fontFamily: "var(--font-mono)", color: "var(--blue-light)", fontSize: "12px" }}>name.wepay.eth</strong>
                {" "}— share it to receive USDC on Base or Solana.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "10px 16px", background: "#f97316", borderRadius: "var(--r-md)" }}>
                <span style={{ fontSize: "18px" }}>💳</span>
                <p style={{ fontSize: "13px", color: "#fff", fontWeight: 600, lineHeight: 1.5 }}>
                  Comes with a virtual Visa card — pay any fiat bill, anywhere.
                </p>
              </div>
              {/* Lobster card image */}
              <div style={{ position: "relative", maxWidth: "340px", borderRadius: "var(--r-lg)", overflow: "hidden", boxShadow: "0 8px 32px rgba(249,115,22,0.25)" }}>
                <img
                  src="/lobster-card.jpg"
                  alt="Lobster.cash Virtual Card"
                  style={{ width: "100%", display: "block", borderRadius: "var(--r-lg)" }}
                />
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  padding: "8px 14px",
                  background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)",
                  display: "flex", alignItems: "center", gap: "6px",
                }}>
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>Powered by</span>
                  <span style={{ fontSize: "13px", color: "#fff", fontWeight: 700, letterSpacing: "-0.01em" }}>Lobster.cash</span>
                  <span style={{ fontSize: "13px" }}>🦞</span>
                </div>
              </div>
            </div>
          </div>

          <p className="fade-up-2" style={{ fontSize: "13px", color: "var(--text-3)", maxWidth: "460px", marginBottom: "36px", lineHeight: 1.6 }}>
            Building your own AI agent costs <strong style={{ color: "var(--text-2)" }}>thousands in engineering and API fees</strong>.
            WePay gives you a production-ready agent for <strong style={{ color: "var(--blue-light)" }}>$19.99/month</strong>.
          </p>

          <div className="fade-up-3" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "14px" }}>
            <ConnectButton label="Connect Wallet to Get Started" />
            <p style={{ fontSize: "12px", color: "var(--text-3)" }}>
              MetaMask · Coinbase Wallet · WalletConnect · and more
            </p>
          </div>
        </div>

        {/* Right — iPhone mockup */}
        <div className="fade-up-2" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <IPhoneMockup />
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 32px 64px" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 800, color: "var(--text)", marginBottom: "12px" }}>
            Paying bills has never been this easy
          </h2>
          <p style={{ fontSize: "15px", color: "var(--text-2)", maxWidth: "460px", margin: "0 auto" }}>
            From anywhere in the world — just message WePay on Telegram.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
          {[
            { step: "01", title: "Subscribe & get set up", desc: "Pay $19.99/month via USDC. Your non-custodial vault, free ENS subdomain, Telegram agent, and virtual Visa card are provisioned automatically.", color: "var(--blue)", bg: "var(--blue-dim)" },
            { step: "02", title: "Fund via your ENS", desc: "Share name.wepay.eth to receive USDC on Base or Solana — no wallet address needed. Funds flow to your vault and virtual card.", color: "var(--green)", bg: "var(--green-dim)" },
            { step: "03", title: "Virtual card for fiat bills", desc: "Rent, utilities, phone — anything that needs a real card. Your agent charges your Visa virtual card funded by USDC. No crypto-savvy merchant needed.", color: "#f97316", bg: "rgba(249,115,22,0.08)" },
            { step: "04", title: "On-chain for crypto payees", desc: "Paying a wallet or ENS address? WePay sends USDC directly on Base. Say \"Pay landlord.eth $1200\" and it's done in seconds.", color: "var(--blue-light)", bg: "var(--blue-dim)" },
          ].map((item) => (
            <div key={item.step} className="card card-hover" style={{ padding: "28px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "var(--r-sm)", background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 500, color: item.color }}>{item.step}</span>
              </div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, color: "var(--text)", marginBottom: "10px" }}>{item.title}</h3>
              <p style={{ fontSize: "14px", color: "var(--text-2)", lineHeight: 1.65 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Two payment rails ─────────────────────────────────────────── */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 32px 64px" }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 800, color: "var(--text)", marginBottom: "10px" }}>
            Two ways to pay — one agent handles both
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-2)", maxWidth: "480px", margin: "0 auto" }}>
            Crypto payees and fiat bills. WePay routes each payment automatically.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          {/* On-chain rail */}
          <div className="card" style={{ padding: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "var(--r-sm)", background: "var(--blue-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>⛓️</div>
              <div>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>On-chain · Base USDC</p>
                <p style={{ fontSize: "12px", color: "var(--text-3)" }}>ENS names, wallet addresses</p>
              </div>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
              {["Pay landlord.eth $1,200", "Send USDC to 0xAbCd…", "Schedule recurring on-chain payments"].map(t => (
                <li key={t} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13px", color: "var(--text-2)" }}>
                  <span style={{ color: "var(--green)", marginTop: "1px" }}>✓</span>{t}
                </li>
              ))}
            </ul>
          </div>
          {/* Fiat rail */}
          <div className="card" style={{ padding: "32px", border: "1px solid rgba(249,115,22,0.3)", background: "rgba(249,115,22,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              {/* Mini debit card */}
              <div style={{
                width: "44px", height: "28px", borderRadius: "6px",
                background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(249,115,22,0.4)",
                flexShrink: 0,
              }}>
                <span style={{ fontSize: "12px" }}>💳</span>
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "15px", fontWeight: 700, color: "#f97316" }}>Virtual Visa · Fiat</p>
                <p style={{ fontSize: "12px", color: "var(--text-3)" }}>Any merchant, anywhere</p>
              </div>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
              {["Pay electric, gas & water bills", "Phone, internet, subscriptions", "Online checkout — just like any Visa"].map(t => (
                <li key={t} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13px", color: "var(--text-2)" }}>
                  <span style={{ color: "#f97316", marginTop: "1px" }}>✓</span>{t}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: "16px", padding: "8px 12px", background: "rgba(249,115,22,0.1)", borderRadius: "var(--r-sm)" }}>
              <p style={{ fontSize: "11px", color: "#f97316", lineHeight: 1.5 }}>
                Funded with USDC via <strong>name.wepay.eth</strong> · powered by Lobster.cash
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 32px 64px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "16px" }}>
          {[
            { icon: "🔐", title: "Non-custodial",     desc: "Your seed phrase is yours alone. WePay never holds your keys or funds." },
            { icon: "🌐", title: "ENS subdomain",     desc: "name.wepay.eth works on Base and Solana — share one name to fund both rails." },
            { icon: "💳", title: "Virtual Visa card", desc: "Pay rent, utilities, subscriptions — any fiat bill charged to your USDC-funded virtual card.", accent: "#f97316" },
            { icon: "🤖", title: "AI agent",          desc: "Natural language bill pay via Telegram. Forward invoices, schedule payments, check balance." },
            { icon: "⛓️", title: "Base network",      desc: "Fast, cheap USDC on Base for on-chain payees. Solana for funding your virtual card." },
          ].map((feat: { icon: string; title: string; desc: string; accent?: string }) => (
            <div key={feat.title} className="card" style={{ padding: "24px", ...(feat.accent ? { border: "1px solid rgba(249,115,22,0.25)", background: "rgba(249,115,22,0.04)" } : {}) }}>
              <div style={{ fontSize: "28px", marginBottom: "12px" }}>{feat.icon}</div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 700, color: feat.accent ?? "var(--text)", marginBottom: "8px" }}>{feat.title}</h3>
              <p style={{ fontSize: "13px", color: "var(--text-2)", lineHeight: 1.6 }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Trust banner ──────────────────────────────────────────────── */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 32px 80px" }}>
        <div style={{ background: "var(--blue-dim)", border: "1px solid rgba(0,102,255,0.2)", borderRadius: "var(--r-xl)", padding: "40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-40px", left: "50%", transform: "translateX(-50%)", width: "200px", height: "200px", background: "var(--blue)", borderRadius: "50%", filter: "blur(80px)", opacity: 0.1, pointerEvents: "none" }} />
          <p style={{ fontFamily: "var(--font-display)", fontSize: "clamp(16px, 2.5vw, 20px)", fontWeight: 600, color: "var(--text)", lineHeight: 1.6, maxWidth: "620px", margin: "0 auto 16px" }}>
            WePay <span style={{ color: "var(--blue-light)" }}>never holds your keys</span>.
            Your vault is generated locally and you receive your seed phrase exactly once.
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-2)" }}>
            Subdomains are permanent ERC-1155 NFTs with{" "}
            <code style={{ fontFamily: "var(--font-mono)", color: "var(--blue-light)", fontSize: "12px" }}>PARENT_CANNOT_CONTROL</code>{" "}
            burned — WePay can never reclaim them.
          </p>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "24px 32px", textAlign: "center" }}>
        <p style={{ fontSize: "13px", color: "var(--text-3)" }}>
          © 2026 WePay ·{" "}
          <a href="https://wepay.eth.limo" style={{ color: "var(--text-2)", textDecoration: "none" }}>wepay.eth</a>
          {" "}· Built on{" "}
          <a href="https://ens.domains" style={{ color: "var(--blue-light)", textDecoration: "none" }}>ENS</a>
          {" · "}
          <a href="https://base.org" style={{ color: "var(--blue-light)", textDecoration: "none" }}>Base</a>
        </p>
      </footer>
    </div>
  );
}
