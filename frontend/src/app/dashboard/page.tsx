"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSubscription } from "@/hooks/useSubscription";
import { useTheme } from "@/lib/theme";

type VaultInfo = {
  vaultAddress: string | null;
  vaultCreatedAt: string | null;
  handle: string | null;
  daysRemaining: number;
};
type MessagingStatus = {
  telegram: { connected: boolean };
  whatsapp: { connected: boolean };
};

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { hasAccess, isLoading: subLoading } = useSubscription();
  const { theme, toggle } = useTheme();

  const { data: vault } = useQuery<VaultInfo>({
    queryKey: ["vault"],
    queryFn: () => api.get("/vault"),
    enabled: hasAccess,
  });

  const { data: messaging } = useQuery<MessagingStatus>({
    queryKey: ["messaging-status"],
    queryFn: () => api.get("/messaging/status"),
    enabled: hasAccess,
  });

  useEffect(() => {
    if (!subLoading && (!isConnected || !hasAccess)) {
      router.replace("/");
    }
  }, [isConnected, hasAccess, subLoading, router]);

  if (subLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
      }}>
        <div className="spinner" />
      </div>
    );
  }

  const ens = vault?.handle ? `${vault.handle}.wepay.eth` : null;
  const agentLive = messaging?.telegram.connected || messaging?.whatsapp.connected;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 24px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg)",
      }}>
        <Link href="/" style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: "18px",
          color: "var(--text)",
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          <span>💸</span> WePay
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {ens && (
            <span className="badge badge-blue" style={{ fontSize: "11px" }}>
              {ens}
            </span>
          )}
          <button
            onClick={toggle}
            style={{
              padding: "7px",
              background: "var(--bg-3)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-sm)",
              color: "var(--text-2)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          <ConnectButton accountStatus="avatar" chainStatus="none" showBalance={false} />
        </div>
      </nav>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>

        {/* Header */}
        <div className="fade-up" style={{ marginBottom: "40px" }}>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(24px, 4vw, 36px)",
            fontWeight: 800,
            color: "var(--text)",
            marginBottom: "6px",
          }}>
            {ens ? `gm, ${vault?.handle}` : "Dashboard"}
          </h1>
          {vault?.vaultAddress && (
            <p style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "var(--text-3)",
            }}>
              {vault.vaultAddress}
            </p>
          )}
        </div>

        {/* Agent status banner */}
        <div className="fade-up-1" style={{
          padding: "20px 24px",
          borderRadius: "var(--r-lg)",
          marginBottom: "32px",
          background: agentLive ? "var(--green-dim)" : "var(--blue-dim)",
          border: `1px solid ${agentLive ? "rgba(0,196,140,0.2)" : "rgba(0,102,255,0.2)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}>
          <div>
            <p style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: "4px",
              fontSize: "15px",
            }}>
              {agentLive ? "✅ Agent is live" : "⚡ Activate your agent"}
            </p>
            <p style={{ fontSize: "13px", color: "var(--text-2)" }}>
              {agentLive
                ? "Send a message on Telegram to pay bills, check balance, or manage payees."
                : "Connect Telegram to start using your AI payment agent."}
            </p>
          </div>
          {!agentLive && (
            <Link href="/onboard/connect/" className="btn-primary" style={{ whiteSpace: "nowrap", fontSize: "14px", padding: "10px 20px" }}>
              Connect Telegram →
            </Link>
          )}
        </div>

        {/* Quick actions */}
        <div className="fade-up-2" style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}>
          {[
            {
              href: "/dashboard/payees/",
              icon: "💸",
              label: "Payees",
              desc: "Add and manage your bill payees",
              accent: "var(--blue)",
              bg: "var(--blue-dim)",
            },
            {
              href: "/onboard/connect/",
              icon: "📱",
              label: "Messaging",
              desc: "Connect Telegram or WhatsApp",
              accent: "var(--green)",
              bg: "var(--green-dim)",
            },
            {
              href: "/dashboard/settings/",
              icon: "⚙️",
              label: "Settings",
              desc: "Spending limits and vault",
              accent: "var(--blue-light)",
              bg: "var(--blue-dim)",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="card card-hover"
              style={{
                padding: "24px",
                display: "block",
                textDecoration: "none",
              }}
            >
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "var(--r-md)",
                background: item.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                marginBottom: "14px",
              }}>
                {item.icon}
              </div>
              <p style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "16px",
                color: "var(--text)",
                marginBottom: "6px",
              }}>
                {item.label}
              </p>
              <p style={{ fontSize: "13px", color: "var(--text-2)" }}>{item.desc}</p>
            </Link>
          ))}
        </div>

        {/* Subscription info */}
        {vault?.daysRemaining !== undefined && (
          <div className="fade-up-3 card" style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <p style={{ fontSize: "13px", color: "var(--text-2)", marginBottom: "2px" }}>Subscription</p>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", color: "var(--text)" }}>
                {vault.daysRemaining > 0
                  ? `${vault.daysRemaining} days remaining`
                  : "Expired — please renew"}
              </p>
            </div>
            <div className={`badge ${vault.daysRemaining > 5 ? "badge-green" : "badge-blue"}`}>
              {vault.daysRemaining > 5 ? "Active" : vault.daysRemaining > 0 ? "Expiring soon" : "Expired"}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
