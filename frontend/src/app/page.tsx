"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { FlipWords } from "@/components/FlipWords";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

// ── Icons ──────────────────────────────────────────────────────────────────

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
    <div className="w-72 rounded-[2.5rem] border-8 border-slate-700 shadow-2xl overflow-hidden flex flex-col bg-slate-100">
      {/* Notch */}
      <div className="bg-slate-800 h-7 flex items-center justify-center shrink-0">
        <div className="w-20 h-4 bg-slate-900 rounded-full" />
      </div>

      {/* Chat header */}
      <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center gap-3 shrink-0">
        <div className="size-9 rounded-full bg-blue-100 flex items-center justify-center text-lg">💸</div>
        <div>
          <p className="font-bold text-slate-900 text-sm leading-tight">WePay Agent</p>
          <p className="text-xs text-blue-600 font-medium flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-blue-500 inline-block" />
            online
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="bg-slate-50 px-3 py-3 flex flex-col gap-2.5">
        {chatMessages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.from === "user" ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[82%] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-line shadow-sm",
              msg.from === "user"
                ? "bg-blue-600 text-white rounded-tr-sm"
                : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
            )}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="bg-white px-3 py-2 border-t border-slate-200 flex items-center gap-2 shrink-0">
        <div className="flex-1 bg-slate-100 rounded-full h-8 px-4 flex items-center text-slate-400 text-xs">
          Message
        </div>
        <div className="size-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
          <svg className="size-3.5 text-white translate-x-px" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
          </svg>
        </div>
      </div>

      {/* Home bar */}
      <div className="bg-white h-5 flex items-center justify-center shrink-0">
        <div className="w-20 h-1 bg-slate-300 rounded-full" />
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

const flipWords = ["Rent", "Cards", "Utilities", "Subscriptions", "Everything"];

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
      <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)] flex items-center justify-between px-6 lg:px-10 h-14">
        <span className="font-heading font-extrabold text-base flex items-center gap-2">
          💸 WePay
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="size-9 rounded-lg flex items-center justify-center border border-[var(--border)] bg-[var(--bg-3)] hover:border-[var(--border-2)] transition-colors cursor-pointer"
            style={{ color: "var(--text-2)" }}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          <ConnectButton accountStatus="avatar" chainStatus="none" showBalance={false} label="Connect Wallet" />
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="px-6 lg:px-12 pt-20 pb-24 bg-[var(--bg-2)]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left */}
          <div>
            <div className="flex flex-wrap gap-2 mb-7">
              <span className="badge badge-green">Non-custodial</span>
              <span className="badge badge-blue">ENS-native</span>
              <span className="badge badge-blue">AI-powered</span>
            </div>

            <h1 className="font-heading font-extrabold text-4xl sm:text-5xl xl:text-6xl leading-[1.1] tracking-tight text-balance mb-5">
              Text WePay<br />
              Agent To{" "}
              <span className="text-blue-400">
                <FlipWords words={flipWords} duration={2800} className="" />
              </span>
            </h1>

            <p className="text-base sm:text-lg leading-relaxed text-pretty mb-8 max-w-lg" style={{ color: "var(--text-2)" }}>
              Your personal AI agent pays bills from anywhere, anytime — just send a quick message on Telegram.
              No app. No login. No hassle.
            </p>

            <div className="space-y-2.5 mb-9">
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-3)] shadow-sm">
                <span className="text-green-400 font-bold text-sm mt-px shrink-0">✓</span>
                <p className="text-sm" style={{ color: "var(--text-2)" }}>
                  You get <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-[var(--blue-dim)] text-blue-400">name.wepay.eth</code> — share it to receive USDC on Base or Solana.
                </p>
              </div>
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-3)] shadow-sm">
                <span className="text-green-400 font-bold text-sm mt-px shrink-0">✓</span>
                <p className="text-sm" style={{ color: "var(--text-2)" }}>
                  Link any Solana wallet — Phantom, Backpack, Ledger — to your ENS name.
                </p>
              </div>
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-3)] shadow-sm opacity-60">
                <span className="text-slate-500 text-sm mt-px shrink-0">○</span>
                <p className="text-sm" style={{ color: "var(--text-2)" }}>
                  Virtual card — <span className="text-orange-400 font-semibold">coming soon</span>. Pay any fiat bill with USDC.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <ConnectButton label="Connect Wallet to Get Started" />
              <p className="text-sm" style={{ color: "var(--text-2)" }}>
                Starting at <strong className="text-blue-400">$19.99 / month</strong>
              </p>
            </div>
            <p className="text-xs mt-4" style={{ color: "var(--text-3)" }}>
              MetaMask · Coinbase Wallet · WalletConnect · and more
            </p>
          </div>

          {/* Right */}
          <div className="flex justify-center lg:justify-end">
            <div className="p-4 rounded-3xl bg-[var(--bg-3)] border border-[var(--border)] shadow-xl">
              <IPhoneMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="px-6 lg:px-12 py-20 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl tracking-tight text-balance mb-3">
              Paying bills has never been this easy
            </h2>
            <p className="text-base text-pretty max-w-sm mx-auto" style={{ color: "var(--text-2)" }}>
              From anywhere in the world — just message WePay on Telegram.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: "01", title: "Subscribe & get set up",     desc: "Pay $19.99/month via USDC. Your non-custodial vault, ENS subdomain, and Telegram agent are provisioned automatically." },
              { step: "02", title: "Fund via your ENS",          desc: "Share name.wepay.eth to receive USDC on Base or Solana — no wallet address needed." },
              { step: "03", title: "Pay crypto payees on-chain", desc: 'Say "Pay landlord.eth $1200" and WePay sends USDC directly on Base in seconds.' },
              { step: "04", title: "Virtual card — coming soon", desc: "Pay rent, utilities, and subscriptions with a virtual card funded by USDC.", muted: true },
            ].map(({ step, title, desc, muted }) => (
              <div key={step} className={cn(
                "rounded-2xl border p-6 shadow-sm",
                "bg-[var(--bg-2)] border-[var(--border)]",
                muted && "opacity-60"
              )}>
                <p className={cn("font-mono text-xs font-bold mb-4 tabular-nums", muted ? "text-orange-400" : "text-blue-400")}>
                  {step}
                </p>
                <h3 className="font-heading font-bold text-sm mb-2 text-balance">{title}</h3>
                <p className="text-xs leading-relaxed text-pretty" style={{ color: "var(--text-2)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Payment rails ─────────────────────────────────────────────────── */}
      <section className="px-6 lg:px-12 py-20 border-t border-[var(--border)] bg-[var(--bg-2)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight text-balance mb-2">
              Two ways to pay — one agent handles both
            </h2>
            <p className="text-sm text-pretty" style={{ color: "var(--text-2)" }}>
              Crypto payees and fiat bills. WePay routes each payment automatically.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-3)] p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">⛓️</span>
                <div>
                  <p className="font-heading font-bold text-sm">On-chain · Base USDC</p>
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>ENS names, wallet addresses</p>
                </div>
              </div>
              <ul className="space-y-3">
                {["Pay landlord.eth $1,200", "Send USDC to 0xAbCd…", "Schedule recurring on-chain payments"].map(t => (
                  <li key={t} className="flex items-start gap-2.5 text-sm">
                    <span className="text-green-400 shrink-0 mt-px">✓</span>
                    <span style={{ color: "var(--text-2)" }}>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-dashed border-orange-500/30 bg-orange-500/5 p-8 opacity-70">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">💳</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-heading font-bold text-sm text-orange-400">Virtual Card · Fiat</p>
                  <span className="badge font-mono text-[10px]" style={{ background: "rgba(249,115,22,0.1)", color: "#f97316", border: "1px solid rgba(249,115,22,0.25)", padding: "2px 8px" }}>
                    Coming soon
                  </span>
                </div>
              </div>
              <p className="text-xs mb-4" style={{ color: "var(--text-3)" }}>Any merchant, anywhere</p>
              <ul className="space-y-3">
                {["Pay electric, gas & water bills", "Phone, internet, subscriptions", "Online checkout — just like any Visa"].map(t => (
                  <li key={t} className="flex items-start gap-2.5 text-sm">
                    <span className="text-orange-400/50 shrink-0 mt-px">○</span>
                    <span style={{ color: "var(--text-3)" }}>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="px-6 lg:px-12 py-20 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { icon: "🔐", title: "Non-custodial", desc: "Your seed phrase is yours alone. WePay never holds your keys or funds." },
            { icon: "🌐", title: "ENS subdomain",  desc: "name.wepay.eth resolves your ETH vault and Solana wallet — one name, any chain." },
            { icon: "💳", title: "Virtual card",   desc: "Pay fiat bills with USDC — coming soon.", muted: true },
            { icon: "🤖", title: "AI agent",       desc: "Natural language bill pay via Telegram. Forward invoices, schedule payments." },
            { icon: "⛓️", title: "Base network",   desc: "Fast, cheap USDC on Base for on-chain payees. Link your Solana wallet too." },
          ].map(({ icon, title, desc, muted }) => (
            <div key={title} className={cn(
              "rounded-2xl border p-5 shadow-sm",
              "bg-[var(--bg-2)] border-[var(--border)]",
              muted && "opacity-60"
            )}>
              <div className="text-2xl mb-3">{icon}</div>
              <h3 className={cn("font-heading font-bold text-sm mb-2 text-balance", muted ? "text-orange-400" : "")}>{title}</h3>
              <p className="text-xs leading-relaxed text-pretty" style={{ color: "var(--text-2)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Trust ─────────────────────────────────────────────────────────── */}
      <section className="px-6 lg:px-12 py-20 border-t border-[var(--border)] bg-[var(--bg-2)]">
        <div className="max-w-2xl mx-auto text-center">
          <p className="font-heading font-semibold text-xl sm:text-2xl leading-snug text-balance mb-4">
            WePay <span className="text-blue-400">never holds your keys</span>.
            Your vault is generated locally and you receive your seed phrase exactly once.
          </p>
          <p className="text-sm text-pretty leading-relaxed" style={{ color: "var(--text-2)" }}>
            Subdomains are permanent ERC-1155 NFTs with{" "}
            <code className="font-mono text-xs text-blue-400">PARENT_CANNOT_CONTROL</code>{" "}
            burned — WePay can never reclaim them.
          </p>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="px-6 lg:px-12 py-6 text-center text-xs border-t border-[var(--border)]" style={{ color: "var(--text-3)" }}>
        © 2026 WePay ·{" "}
        <a href="https://wepay.eth.limo" className="hover:text-[var(--text-2)] transition-colors">wepay.eth</a>
        {" "}· Built on{" "}
        <a href="https://ens.domains" className="text-blue-400 hover:text-blue-300 transition-colors">ENS</a>
        {" · "}
        <a href="https://base.org" className="text-blue-400 hover:text-blue-300 transition-colors">Base</a>
      </footer>
    </div>
  );
}
