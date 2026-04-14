"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

// ─── Theme toggle icons ────────────────────────────────────────────────────

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

// ─── Animated word cycler ──────────────────────────────────────────────────

const BILLS = ["Rent", "Utilities", "Subscriptions", "Car Insurance", "Anything"];

function CyclingWord() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setIdx(i => (i + 1) % BILLS.length); setVisible(true); }, 350);
    }, 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <span
      className="text-blue-400 inline-block"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-8px)",
        transition: "opacity 0.35s ease, transform 0.35s ease",
      }}
    >
      {BILLS[idx]}
    </span>
  );
}

// ─── iPhone chat mockup ────────────────────────────────────────────────────

const MESSAGES = [
  { from: "u", text: "Pay my electric bill $87" },
  { from: "a", text: "✓ $87.00 USDC sent\nConEd · Base · just now" },
  { from: "u", text: "Schedule rent for the 1st" },
  { from: "a", text: "✓ $1,200 USDC scheduled\nApr 1 · landlord.eth" },
  { from: "u", text: "What's my balance?" },
  { from: "a", text: "$2,450.00 USDC\nname.wepay.eth" },
];

function Phone() {
  return (
    <div
      className="relative w-[290px] shrink-0"
      style={{ filter: "drop-shadow(0 32px 48px rgba(0,0,0,0.6))" }}
    >
      {/* Phone body */}
      <div className="rounded-[2.75rem] border-[9px] border-slate-700 overflow-hidden flex flex-col bg-white">
        {/* Notch bar */}
        <div className="bg-slate-900 h-7 flex items-center justify-center shrink-0">
          <div className="w-[88px] h-[18px] bg-black rounded-full" />
        </div>

        {/* Chat header */}
        <div className="bg-white px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5 shrink-0">
          <div className="size-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">W</div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 text-[13px] leading-none mb-0.5">WePay Agent</p>
            <p className="text-[11px] text-blue-500 flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
              online
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="bg-slate-50 px-3 py-2.5 flex flex-col gap-2 min-h-0">
          {MESSAGES.map((m, i) => (
            <div key={i} className={cn("flex", m.from === "u" ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[78%] px-3 py-2 text-[11.5px] leading-snug whitespace-pre-line",
                m.from === "u"
                  ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm"
                  : "bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm shadow-sm"
              )}>
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="bg-white border-t border-slate-100 px-3 py-2 flex items-center gap-2 shrink-0">
          <div className="flex-1 bg-slate-100 rounded-full h-7 px-3 text-[11px] text-slate-400 flex items-center">
            Message WePay…
          </div>
          <div className="size-7 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
            <svg className="size-3 text-white translate-x-px" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
          </div>
        </div>

        {/* Home bar */}
        <div className="bg-white h-4 flex items-center justify-center shrink-0">
          <div className="w-[72px] h-[3px] bg-slate-300 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────

const STEPS = [
  { n: "01", title: "Subscribe",       body: "Pay $19.99/mo via USDC. Your non-custodial OWS vault, free ENS subdomain, and Telegram agent are live immediately." },
  { n: "02", title: "Fund your vault", body: "Share name.wepay.eth to receive USDC on Base or Solana. No wallet address — just your name." },
  { n: "03", title: "Text to pay",     body: 'Message WePay on Telegram: "Pay landlord.eth $1,200" — USDC is sent on Base in seconds.' },
  { n: "04", title: "Virtual card ↗",  body: "Coming soon — pay any fiat bill with USDC via virtual Visa. Evaluating Visa Intelligent Commerce.", dim: true },
];

const FEATURES = [
  { icon: "🔐", title: "Non-custodial",  body: "Your seed phrase is yours alone. WePay never holds keys." },
  { icon: "🌐", title: "ENS subdomain",  body: "name.wepay.eth resolves ETH + Solana. One name, every chain." },
  { icon: "⛓️", title: "Base network",   body: "Fast, cheap USDC on Base. Phantom/Backpack supported too." },
  { icon: "🤖", title: "AI agent",       body: "Natural language bill pay on Telegram. No app needed." },
  { icon: "💳", title: "Virtual card",   body: "Pay fiat with USDC — coming soon.", dim: true },
];

export default function LandingPage() {
  const { isConnected } = useAccount();
  const { theme, toggle } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) router.push("/onboard/");
  }, [isConnected, router]);

  return (
    <div className="min-h-dvh" style={{ background: "var(--bg)", color: "var(--text)" }}>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 h-14 flex items-center justify-between px-6 lg:px-10"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}
      >
        <span className="font-heading font-extrabold text-base tracking-tight flex items-center gap-2">
          💸 <span>WePay</span>
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            aria-label={theme === "dark" ? "Light mode" : "Dark mode"}
            className="size-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
            style={{ border: "1px solid var(--border)", background: "var(--bg-3)", color: "var(--text-3)" }}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          <ConnectButton accountStatus="avatar" chainStatus="none" showBalance={false} label="Connect Wallet" />
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="px-6 lg:px-16 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-20">

          {/* Text side */}
          <div className="flex-1 min-w-0">
            {/* Live badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 font-mono text-xs uppercase tracking-widest font-medium text-blue-400"
              style={{ background: "var(--blue-dim)", border: "1px solid rgba(0,102,255,0.2)" }}>
              <span className="size-1.5 rounded-full bg-emerald-400 inline-block" style={{ boxShadow: "0 0 6px #34d399" }} />
              Live on Base
            </div>

            {/* Headline */}
            <h1 className="font-heading font-black tracking-tight text-balance mb-6" style={{ fontSize: "clamp(44px, 7vw, 84px)", lineHeight: 1.0 }}>
              Pay <CyclingWord /><br />
              with a text<br />
              message.
            </h1>

            {/* Sub */}
            <p className="text-lg leading-relaxed text-pretty mb-10 max-w-lg" style={{ color: "var(--text-2)" }}>
              WePay is a personal AI finance agent that lives in Telegram. It pays your bills directly from a non-custodial USDC vault — no app, no login, just a message.
            </p>

            {/* Bullets */}
            <div className="space-y-2 mb-10">
              {[
                { ok: true,  text: "Free ENS subdomain — name.wepay.eth" },
                { ok: true,  text: "Solana wallet linked to your ENS" },
                { ok: false, text: "Virtual Visa card — coming soon" },
              ].map(({ ok, text }) => (
                <div key={text} className={cn("flex items-center gap-3 text-sm", !ok && "opacity-50")}>
                  <span className={cn("font-bold text-xs shrink-0", ok ? "text-emerald-400" : "text-slate-500")}>
                    {ok ? "✓" : "○"}
                  </span>
                  <span style={{ color: "var(--text-2)" }}>{text}</span>
                </div>
              ))}
            </div>

            {/* CTA row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <ConnectButton label="Get Started — $19.99 / mo" />
              <p className="text-sm" style={{ color: "var(--text-3)" }}>
                MetaMask · Coinbase · WalletConnect
              </p>
            </div>
          </div>

          {/* Phone side */}
          <div className="shrink-0 flex items-center justify-center">
            <Phone />
          </div>
        </div>
      </section>

      {/* ── Stat strip ──────────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-16 py-5 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { stat: "$0",       label: "Withdrawal fees" },
            { stat: "< 5s",     label: "On-chain settlement" },
            { stat: "100%",     label: "Non-custodial" },
            { stat: "∞",        label: "Payees supported" },
          ].map(({ stat, label }) => (
            <div key={label} className="text-center">
              <p className="font-heading font-black text-2xl sm:text-3xl text-blue-400 tabular-nums mb-0.5">{stat}</p>
              <p className="font-mono text-xs uppercase tracking-wider" style={{ color: "var(--text-3)" }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section className="px-6 lg:px-16 py-20" style={{ background: "var(--bg)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <p className="font-mono text-xs uppercase tracking-widest text-blue-400 mb-3">How it works</p>
            <h2 className="font-heading font-black text-3xl sm:text-4xl tracking-tight text-balance">
              From signup to paid bills<br />in under 5 minutes.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px"
            style={{ background: "var(--border)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden" }}>
            {STEPS.map(({ n, title, body, dim }) => (
              <div key={n} className={cn("p-6 lg:p-7", dim && "opacity-55")} style={{ background: "var(--bg-2)" }}>
                <p className="font-mono text-xs text-blue-400 font-bold mb-5 tabular-nums">{n}</p>
                <h3 className="font-heading font-bold text-base mb-2.5 text-balance">{title}</h3>
                <p className="text-sm leading-relaxed text-pretty" style={{ color: "var(--text-2)" }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Two rails ───────────────────────────────────────────────────── */}
      <section className="px-6 lg:px-16 py-20" style={{ background: "var(--bg-2)", borderTop: "1px solid var(--border)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <p className="font-mono text-xs uppercase tracking-widest text-blue-400 mb-3">Payment rails</p>
            <h2 className="font-heading font-black text-3xl sm:text-4xl tracking-tight text-balance">
              One agent.<br />Two ways to pay.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* On-chain */}
            <div className="rounded-2xl p-7" style={{ background: "var(--bg-3)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: "var(--blue-dim)" }}>⛓️</div>
                <div>
                  <p className="font-heading font-bold text-sm">On-chain · Base USDC</p>
                  <p className="font-mono text-xs mt-0.5" style={{ color: "var(--text-3)" }}>Available now</p>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  "Pay any ENS name or wallet address",
                  "USDC on Base — fast & cheap",
                  "Schedule recurring payments",
                  "Full transaction history",
                ].map(t => (
                  <li key={t} className="flex items-start gap-3 text-sm">
                    <span className="text-emerald-400 shrink-0 mt-0.5 font-bold">✓</span>
                    <span style={{ color: "var(--text-2)" }}>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Virtual card */}
            <div className="rounded-2xl p-7 opacity-65" style={{ background: "var(--bg-3)", border: "1px dashed rgba(251,146,60,0.35)" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="size-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: "rgba(251,146,60,0.1)" }}>💳</div>
                <div>
                  <p className="font-heading font-bold text-sm text-orange-400">Virtual Card · Fiat</p>
                  <p className="font-mono text-xs mt-0.5" style={{ color: "var(--text-3)" }}>Coming soon</p>
                </div>
              </div>
              <p className="text-xs mb-5" style={{ color: "var(--text-3)" }}>
                Evaluating Visa Intelligent Commerce to issue virtual cards funded by USDC.
              </p>
              <ul className="space-y-3">
                {[
                  "Electric, gas & water bills",
                  "Phone & internet subscriptions",
                  "Any online merchant — just like Visa",
                ].map(t => (
                  <li key={t} className="flex items-start gap-3 text-sm">
                    <span className="text-orange-400/60 shrink-0 mt-0.5">○</span>
                    <span style={{ color: "var(--text-3)" }}>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className="px-6 lg:px-16 py-20" style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {FEATURES.map(({ icon, title, body, dim }) => (
              <div key={title} className={cn("rounded-xl p-5", dim && "opacity-55")}
                style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
                <div className="text-2xl mb-3">{icon}</div>
                <p className={cn("font-heading font-bold text-sm mb-1.5 text-balance", dim && "text-orange-400")}>{title}</p>
                <p className="text-xs leading-relaxed text-pretty" style={{ color: "var(--text-2)" }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust ───────────────────────────────────────────────────────── */}
      <section className="px-6 lg:px-16 py-20" style={{ background: "var(--bg-2)", borderTop: "1px solid var(--border)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-blue-400 mb-5">Security</p>
          <h2 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight text-balance mb-5 leading-tight">
            WePay <span className="text-blue-400">never holds your keys.</span><br />
            Your vault. Your funds. Always.
          </h2>
          <p className="text-base leading-relaxed text-pretty" style={{ color: "var(--text-2)" }}>
            Your vault is generated locally — you receive your seed phrase once and only once.
            Subdomains are permanent ERC-1155 NFTs with{" "}
            <code className="font-mono text-sm text-blue-400">PARENT_CANNOT_CONTROL</code>{" "}
            burned in. WePay can never reclaim them.
          </p>
          <div className="mt-10">
            <ConnectButton label="Get Started — $19.99 / mo" />
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="px-6 lg:px-16 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
        style={{ borderTop: "1px solid var(--border)", color: "var(--text-3)" }}>
        <span>© 2026 WePay</span>
        <div className="flex items-center gap-4">
          <a href="https://wepay.eth.limo" className="hover:text-[var(--text-2)] transition-colors">wepay.eth</a>
          <span style={{ color: "var(--border-2)" }}>·</span>
          <a href="https://ens.domains" className="text-blue-400 hover:text-blue-300 transition-colors">ENS</a>
          <span style={{ color: "var(--border-2)" }}>·</span>
          <a href="https://base.org" className="text-blue-400 hover:text-blue-300 transition-colors">Base</a>
        </div>
      </footer>
    </div>
  );
}
