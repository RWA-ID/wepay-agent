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

// ── iPhone mockup ──────────────────────────────────────────────────────────

const chatMessages = [
  { from: "user",  text: "Pay my electric bill $87" },
  { from: "agent", text: "✓ $87.00 USDC sent\nConEd · Base · Apr 13" },
  { from: "user",  text: "Pay rent on the 1st" },
  { from: "agent", text: "✓ $1,200 USDC scheduled\nApr 1 · landlord.eth" },
  { from: "user",  text: "What's my balance?" },
  { from: "agent", text: "$42.50 USDC on Base\n\nFund: name.wepay.eth" },
];

function IPhoneMockup() {
  return (
    <div className="w-[300px] h-[620px] rounded-[3rem] border-[10px] border-slate-900 shadow-2xl relative overflow-hidden flex flex-col bg-slate-100">
      {/* Dynamic Island */}
      <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 rounded-b-2xl w-36 mx-auto z-20" />

      {/* Header */}
      <div className="bg-white px-4 pt-10 pb-3 border-b border-slate-200 flex items-center gap-3 z-10 shadow-sm">
        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-lg">💸</div>
        <div>
          <p className="font-bold text-slate-900 text-sm leading-tight">WePay Agent</p>
          <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
            online
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 bg-slate-50 px-3 py-3 flex flex-col gap-3 overflow-hidden">
        {chatMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[82%] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-line shadow-sm ${
              msg.from === "user"
                ? "bg-blue-600 text-white rounded-tr-sm"
                : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input bar */}
      <div className="bg-white px-3 py-2 border-t border-slate-200 flex items-center gap-2">
        <div className="flex-1 bg-slate-100 rounded-full h-9 px-4 flex items-center text-slate-400 text-xs">Message</div>
        <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-white ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
          </svg>
        </div>
      </div>

      {/* Home indicator */}
      <div className="bg-white h-5 flex items-center justify-center">
        <div className="w-24 h-1 bg-slate-300 rounded-full" />
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

const flipWords = ["Rent", "Cards", "Utilities", "Subscriptions", "Everything!"];

export default function LandingPage() {
  const { isConnected } = useAccount();
  const { theme, toggle } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) router.push("/onboard/");
  }, [isConnected, router]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 py-4"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)", backdropFilter: "blur(12px)" }}>
        <div className="font-heading font-extrabold text-xl flex items-center gap-2" style={{ color: "var(--text)" }}>
          <span>💸</span> WePay
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggle} aria-label="Toggle theme"
            className="p-2 rounded-lg"
            style={{ background: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--text-2)", cursor: "pointer", display: "flex", alignItems: "center" }}>
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          <ConnectButton accountStatus="avatar" chainStatus="none" showBalance={false} label="Connect Wallet" />
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative py-20 lg:py-32 px-6 md:px-12 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-3xl opacity-20 -z-10 pointer-events-none"
          style={{ background: "radial-gradient(ellipse, var(--blue) 0%, transparent 70%)" }} />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

          {/* Left */}
          <div className="lg:col-span-7 flex flex-col items-start">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-8">
              {[
                { label: "Non-custodial", color: "#16a34a", bg: "rgba(22,163,74,0.1)",   border: "rgba(22,163,74,0.25)" },
                { label: "ENS-native",    color: "#4f46e5", bg: "rgba(79,70,229,0.1)",   border: "rgba(79,70,229,0.25)" },
                { label: "AI-powered",    color: "var(--blue)", bg: "var(--blue-dim)",   border: "rgba(0,102,255,0.25)" },
              ].map(({ label, color, bg, border }) => (
                <span key={label} className="px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase"
                  style={{ color, background: bg, border: `1px solid ${border}` }}>
                  {label}
                </span>
              ))}
            </div>

            {/* Headline */}
            <h1 className="font-heading font-extrabold leading-[1.05] tracking-tight mb-6"
              style={{ fontSize: "clamp(42px, 6vw, 80px)", color: "var(--text)" }}>
              Text WePay<br />Agent To<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">
                <FlipWords words={flipWords} duration={2800} className="" />
              </span>
            </h1>

            {/* Subhead */}
            <p className="text-lg md:text-xl mb-10 max-w-2xl leading-relaxed" style={{ color: "var(--text-2)" }}>
              Your personal AI agent pays bills from anywhere, anytime — just send a quick message on Telegram.
              No app. No login. No hassle.
            </p>

            {/* Feature bullets */}
            <div className="w-full space-y-3 mb-10">
              {[
                {
                  icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>,
                  iconColor: "var(--blue)",
                  content: <>You get <code className="font-mono text-xs px-1 py-0.5 rounded" style={{ color: "#3b82f6", background: "var(--blue-dim)" }}>name.wepay.eth</code> — share it to receive USDC on Base or Solana.</>,
                  opacity: 1,
                },
                {
                  icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>,
                  iconColor: "var(--blue)",
                  content: <>Link any Solana wallet — Phantom, Backpack, Ledger — to your ENS name.</>,
                  opacity: 1,
                },
                {
                  icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>,
                  iconColor: "var(--text-3)",
                  content: <>Virtual card — <strong className="text-orange-500">coming soon</strong>. Pay any fiat bill with USDC.</>,
                  opacity: 0.65,
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl"
                  style={{ background: "var(--bg-2)", border: "1px solid var(--border)", opacity: item.opacity }}>
                  <div className="mt-0.5 shrink-0" style={{ color: item.iconColor }}>{item.icon}</div>
                  <p className="text-sm font-medium leading-relaxed" style={{ color: "var(--text-2)" }}>{item.content}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <ConnectButton label="Connect Wallet to Get Started" />
              <div>
                <p className="text-xs mb-1" style={{ color: "var(--text-3)" }}>
                  Building your own AI agent costs <strong style={{ color: "var(--text-2)" }}>thousands</strong> in engineering fees.
                </p>
                <p className="text-sm font-medium" style={{ color: "var(--text-2)" }}>
                  WePay gives you a production-ready agent for <strong style={{ color: "#3b82f6" }}>$19.99/month</strong>.
                </p>
              </div>
            </div>
            <p className="text-xs mt-5" style={{ color: "var(--text-3)" }}>
              MetaMask · Coinbase Wallet · WalletConnect · and more
            </p>
          </div>

          {/* Right — phone */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative">
              <div className="absolute inset-0 -m-10 rounded-full blur-3xl opacity-15 pointer-events-none"
                style={{ background: "var(--blue)" }} />
              <IPhoneMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        <div className="text-center mb-12">
          <h2 className="font-heading font-extrabold tracking-tight mb-3"
            style={{ fontSize: "clamp(24px, 4vw, 38px)", color: "var(--text)" }}>
            Paying bills has never been this easy
          </h2>
          <p className="text-base max-w-md mx-auto" style={{ color: "var(--text-2)" }}>
            From anywhere in the world — just message WePay on Telegram.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { step: "01", title: "Subscribe & get set up",    desc: "Pay $19.99/month via USDC. Your non-custodial vault, free ENS subdomain, and Telegram agent are provisioned automatically.", accent: "var(--blue)" },
            { step: "02", title: "Fund via your ENS",         desc: "Share name.wepay.eth to receive USDC on Base or Solana — no wallet address needed. Funds flow directly to your vault.", accent: "var(--green)" },
            { step: "03", title: "On-chain for crypto payees",desc: "Paying a wallet or ENS address? WePay sends USDC directly on Base. Say \"Pay landlord.eth $1200\" and it's done in seconds.", accent: "var(--blue-light)" },
            { step: "04", title: "Virtual card — coming soon",desc: "Pay rent, utilities, and subscriptions with a virtual card funded by USDC. Evaluating Visa Intelligent Commerce.", accent: "#f97316" },
          ].map(({ step, title, desc, accent }) => (
            <div key={step} className="p-6 rounded-2xl"
              style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                style={{ background: `color-mix(in srgb, ${accent} 15%, transparent)` }}>
                <span className="font-mono text-sm font-semibold" style={{ color: accent }}>{step}</span>
              </div>
              <h3 className="font-heading font-bold text-base mb-2" style={{ color: "var(--text)" }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Two payment rails ─────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-16">
        <div className="text-center mb-10">
          <h2 className="font-heading font-extrabold tracking-tight mb-2"
            style={{ fontSize: "clamp(22px, 3.5vw, 32px)", color: "var(--text)" }}>
            Two ways to pay — one agent handles both
          </h2>
          <p className="text-sm" style={{ color: "var(--text-2)" }}>
            Crypto payees and fiat bills. WePay routes each payment automatically.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-8 rounded-2xl" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{ background: "var(--blue-dim)" }}>⛓️</div>
              <div>
                <p className="font-heading font-bold text-sm" style={{ color: "var(--text)" }}>On-chain · Base USDC</p>
                <p className="text-xs" style={{ color: "var(--text-3)" }}>ENS names, wallet addresses</p>
              </div>
            </div>
            <ul className="space-y-3">
              {["Pay landlord.eth $1,200", "Send USDC to 0xAbCd…", "Schedule recurring on-chain payments"].map(t => (
                <li key={t} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-2)" }}>
                  <span style={{ color: "var(--green)", flexShrink: 0, marginTop: "1px" }}>✓</span>{t}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-8 rounded-2xl" style={{ background: "rgba(249,115,22,0.04)", border: "1px dashed rgba(249,115,22,0.3)" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.25)" }}>💳</div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-heading font-bold text-sm text-orange-500">Virtual Card · Fiat</p>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono"
                  style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.25)", color: "#f97316" }}>
                  Coming soon
                </span>
              </div>
            </div>
            <p className="text-xs mb-4" style={{ color: "var(--text-3)" }}>Any merchant, anywhere</p>
            <ul className="space-y-3">
              {["Pay electric, gas & water bills", "Phone, internet, subscriptions", "Online checkout — just like any Visa"].map(t => (
                <li key={t} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-3)" }}>
                  <span style={{ color: "rgba(249,115,22,0.5)", flexShrink: 0, marginTop: "1px" }}>○</span>{t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { icon: "🔐", title: "Non-custodial", desc: "Your seed phrase is yours alone. WePay never holds your keys or funds." },
            { icon: "🌐", title: "ENS subdomain", desc: "name.wepay.eth resolves your ETH vault and Solana wallet — one name, any chain." },
            { icon: "💳", title: "Virtual card",  desc: "Pay fiat bills with USDC — coming soon. Evaluating Visa Intelligent Commerce.", accent: "#f97316" },
            { icon: "🤖", title: "AI agent",      desc: "Natural language bill pay via Telegram. Forward invoices, schedule payments." },
            { icon: "⛓️", title: "Base network",  desc: "Fast, cheap USDC on Base for on-chain payees. Link your Solana wallet too." },
          ].map(({ icon, title, desc, accent }) => (
            <div key={title} className="p-5 rounded-2xl"
              style={{
                background: accent ? "rgba(249,115,22,0.04)" : "var(--bg-2)",
                border: `1px solid ${accent ? "rgba(249,115,22,0.2)" : "var(--border)"}`,
              }}>
              <div className="text-2xl mb-3">{icon}</div>
              <h3 className="font-heading font-bold text-sm mb-2" style={{ color: accent ?? "var(--text)" }}>{title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Trust banner ──────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-20">
        <div className="relative rounded-3xl p-10 text-center overflow-hidden"
          style={{ background: "var(--blue-dim)", border: "1px solid rgba(0,102,255,0.2)" }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-10 pointer-events-none"
            style={{ background: "var(--blue)" }} />
          <p className="font-heading font-semibold relative z-10 mb-3"
            style={{ fontSize: "clamp(16px, 2.5vw, 20px)", color: "var(--text)", lineHeight: 1.6, maxWidth: "600px", margin: "0 auto 12px" }}>
            WePay <span style={{ color: "var(--blue-light)" }}>never holds your keys</span>.
            Your vault is generated locally and you receive your seed phrase exactly once.
          </p>
          <p className="text-sm relative z-10" style={{ color: "var(--text-2)" }}>
            Subdomains are permanent ERC-1155 NFTs with{" "}
            <code className="font-mono text-xs" style={{ color: "var(--blue-light)" }}>PARENT_CANNOT_CONTROL</code>{" "}
            burned — WePay can never reclaim them.
          </p>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="px-6 md:px-12 py-6 text-center text-sm"
        style={{ borderTop: "1px solid var(--border)", color: "var(--text-3)" }}>
        © 2026 WePay ·{" "}
        <a href="https://wepay.eth.limo" style={{ color: "var(--text-2)", textDecoration: "none" }}>wepay.eth</a>
        {" "}· Built on{" "}
        <a href="https://ens.domains" style={{ color: "var(--blue-light)", textDecoration: "none" }}>ENS</a>
        {" · "}
        <a href="https://base.org" style={{ color: "var(--blue-light)", textDecoration: "none" }}>Base</a>
      </footer>
    </div>
  );
}
