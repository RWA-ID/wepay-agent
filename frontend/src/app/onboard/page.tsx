"use client";

import { useState, useEffect, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useWalletClient, useChainId } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { HelioCheckout } from "@/components/HelioCheckout";
import { VaultSetup } from "@/components/VaultSetup";
import { SubdomainClaimer } from "@/components/SubdomainClaimer";
import { TelegramConnect } from "@/components/TelegramConnect";
import { api } from "@/lib/api";
import { signInWithEthereum } from "@/lib/siwe";
import { setAuthToken, getAuthToken } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────

type Step = "subscribe" | "vault" | "solana" | "ens" | "setup";

const STEPS: Step[] = ["subscribe", "vault", "solana", "ens", "setup"];
const STEP_LABELS = ["Subscribe", "Create Vault", "Solana Wallet", "Claim ENS", "Set Up Agent"];

// ── Step indicator ─────────────────────────────────────────────────────────

function StepBar({ current }: { current: Step }) {
  const idx = STEPS.indexOf(current);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
      {STEPS.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%",
              background: i < idx ? "var(--blue)" : i === idx ? "var(--blue)" : "var(--bg-3)",
              border: i <= idx ? "none" : "1px solid var(--border-2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "12px", fontWeight: 600,
              color: i <= idx ? "white" : "var(--text-3)",
              transition: "all 0.3s ease",
              flexShrink: 0,
            }}>
              {i < idx ? "✓" : i + 1}
            </div>
            <span style={{
              fontSize: "10px", fontFamily: "var(--font-mono)",
              color: i === idx ? "var(--blue-light)" : i < idx ? "var(--text-2)" : "var(--text-3)",
              whiteSpace: "nowrap",
            }}>
              {STEP_LABELS[i]}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ flex: 1, height: "2px", background: i < idx ? "var(--blue)" : "var(--border)", margin: "0 8px", marginBottom: "18px", transition: "background 0.3s ease" }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Step 1: Subscribe ──────────────────────────────────────────────────────

function SubscribeStep({ userId, onSuccess }: { userId?: string; onSuccess: () => void }) {
  return (
    <div>
      <div className="fade-up" style={{ marginBottom: "32px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: "8px" }}>
          Start your WePay plan
        </h1>
        <p style={{ fontSize: "16px", color: "var(--text-2)", lineHeight: 1.6 }}>
          Everything you need to pay bills with a text message.
        </p>
      </div>

      {/* Pricing card */}
      <div className="fade-up-1 card" style={{ padding: "28px", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
          <div>
            <div className="badge badge-blue" style={{ marginBottom: "12px" }}>Monthly · cancel anytime</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "48px", fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>$19.99</span>
              <span style={{ fontSize: "14px", color: "var(--text-3)" }}>/month</span>
            </div>
          </div>
          <span style={{ fontSize: "40px" }}>💸</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[
            { icon: "🔐", text: "Non-custodial OWS vault — you own the keys" },
            { icon: "🌐", text: "Free name.wepay.eth ENS subdomain" },
            { icon: "🤖", text: "AI agent on Telegram — natural language payments" },
            { icon: "📄", text: "Invoice OCR — forward any bill to pay it automatically" },
            { icon: "⛓️", text: "USDC on Base — fast, cheap transactions" },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <span style={{ fontSize: "16px", flexShrink: 0 }}>{icon}</span>
              <span style={{ fontSize: "14px", color: "var(--text-2)", lineHeight: 1.5 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Helio checkout */}
      <div className="fade-up-2">
        <HelioCheckout userId={userId} onSuccess={() => onSuccess()} />
        <p style={{ fontSize: "12px", color: "var(--text-3)", textAlign: "center", marginTop: "12px" }}>
          Payments processed by Helio · USDC on Solana or Base
        </p>
      </div>
    </div>
  );
}

// ── Step 2: Vault ──────────────────────────────────────────────────────────

function VaultStep({ onComplete }: { onComplete: (addr: string) => void }) {
  return (
    <div>
      <div className="fade-up" style={{ marginBottom: "32px" }}>
        <div className="badge badge-blue" style={{ marginBottom: "16px" }}>Step 2 of 5</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: "8px" }}>
          Create your vault
        </h1>
        <p style={{ fontSize: "16px", color: "var(--text-2)", lineHeight: 1.6 }}>
          Your non-custodial wallet is generated right here in your browser. WePay delivers your seed phrase{" "}
          <strong style={{ color: "var(--text)" }}>exactly once</strong> — write it down and keep it safe.
        </p>
      </div>

      <div className="fade-up-1" style={{
        display: "flex", gap: "12px", padding: "14px 16px",
        background: "rgba(255,178,36,0.08)", border: "1px solid rgba(255,178,36,0.25)",
        borderRadius: "var(--r-md)", marginBottom: "24px",
      }}>
        <span style={{ fontSize: "18px", flexShrink: 0 }}>⚠️</span>
        <p style={{ fontSize: "13px", color: "var(--text-2)", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--warning)" }}>Save your seed phrase when shown.</strong>{" "}
          It will not be displayed again. Anyone with your seed phrase has full access to your vault.
        </p>
      </div>

      <div className="fade-up-2">
        <VaultSetup onComplete={onComplete} />
      </div>
    </div>
  );
}

// ── Step 3: Solana Wallet ──────────────────────────────────────────────────

function SolanaWalletStep({ onComplete, onSkip }: { onComplete: (address: string) => void; onSkip: () => void }) {
  const [address, setAddress] = useState("");
  const [valid, setValid] = useState<boolean | null>(null);

  function validate(val: string) {
    const ok = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(val);
    setValid(val.length === 0 ? null : ok);
  }

  return (
    <div>
      <div className="fade-up" style={{ marginBottom: "32px" }}>
        <div className="badge badge-blue" style={{ marginBottom: "16px" }}>Step 3 of 5</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: "8px" }}>
          Link your Solana wallet
        </h1>
        <p style={{ fontSize: "16px", color: "var(--text-2)", lineHeight: 1.6 }}>
          Your ENS subdomain will store both your Ethereum and Solana addresses — so anyone can pay you USDC on either chain using just <strong style={{ fontFamily: "var(--font-mono)", color: "var(--blue-light)", fontSize: "14px" }}>yourname.wepay.eth</strong>.
        </p>
      </div>

      {/* Wallet options */}
      <div className="fade-up-1" style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
        {[
          { name: "Phantom", color: "#9945FF" },
          { name: "Backpack", color: "#E33E3F" },
          { name: "Ledger", color: "#000" },
        ].map(({ name, color }) => (
          <div key={name} style={{
            padding: "6px 14px", borderRadius: "var(--r-sm)",
            background: "var(--bg-2)", border: "1px solid var(--border)",
            fontSize: "12px", fontWeight: 600, color,
          }}>{name}</div>
        ))}
        <div style={{
          padding: "6px 14px", borderRadius: "var(--r-sm)",
          background: "var(--bg-2)", border: "1px solid var(--border)",
          fontSize: "12px", color: "var(--text-3)",
        }}>+ any wallet</div>
      </div>

      <div className="fade-up-1" style={{ marginBottom: "24px" }}>
        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>
          Solana wallet address{" "}
          <span style={{ fontWeight: 400, color: "var(--text-3)" }}>(optional)</span>
        </label>
        <p style={{ fontSize: "12px", color: "var(--text-2)", marginBottom: "8px", lineHeight: 1.5 }}>
          Open your wallet app, copy your Solana public key, and paste it here. This will be embedded in your ENS name so people can send you USDC on Solana.
        </p>
        <input
          value={address}
          onChange={(e) => { setAddress(e.target.value.trim()); validate(e.target.value.trim()); }}
          placeholder="e.g. 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83hfHsz..."
          style={{
            width: "100%", padding: "10px 12px",
            background: "var(--bg-2)",
            border: `1px solid ${valid === false ? "var(--error)" : valid === true ? "var(--green)" : "var(--border)"}`,
            borderRadius: "var(--r-sm)", color: "var(--text)", fontSize: "13px",
            fontFamily: "var(--font-mono)", outline: "none",
          }}
        />
        {valid === false && (
          <p style={{ fontSize: "11px", color: "var(--error)", marginTop: "4px" }}>Invalid Solana address — must be base58, 32–44 characters</p>
        )}
        {valid === true && (
          <p style={{ fontSize: "11px", color: "var(--green)", marginTop: "4px" }}>✓ Valid — will be embedded in your ENS name</p>
        )}
      </div>

      <div className="fade-up-2" style={{ display: "flex", gap: "12px" }}>
        <button
          onClick={() => onComplete(valid === true ? address : "")}
          disabled={valid === false}
          className="btn-primary"
          style={{ flex: 1, padding: "14px 0", fontSize: "15px", opacity: valid === false ? 0.5 : 1 }}
        >
          {valid === true ? "Save & Continue" : "Continue without Solana"}
        </button>
      </div>

      <button onClick={onSkip} style={{ marginTop: "12px", background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "var(--text-3)", textDecoration: "underline", padding: 0, display: "block" }}>
        Skip for now
      </button>
    </div>
  );
}

// ── Step 4: ENS ────────────────────────────────────────────────────────────

function EnsStep({ vaultAddress, solanaAddress, onClaimed, onSkip }: { vaultAddress: `0x${string}`; solanaAddress?: string; onClaimed: (handle: string) => void; onSkip: () => void }) {
  return (
    <div>
      <div className="fade-up" style={{ marginBottom: "32px" }}>
        <div className="badge badge-blue" style={{ marginBottom: "16px" }}>Step 4 of 5</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: "8px" }}>
          Claim your ENS subdomain
        </h1>
        <p style={{ fontSize: "16px", color: "var(--text-2)", lineHeight: 1.6 }}>
          Your universal payment address. Share <strong style={{ fontFamily: "var(--font-mono)", color: "var(--blue-light)", fontSize: "14px" }}>yourname.wepay.eth</strong> to receive USDC on Base{solanaAddress ? " or Solana" : ""} — all from one name.
        </p>
      </div>

      <div className="fade-up-1" style={{
        display: "flex", gap: "12px", padding: "14px 16px",
        background: "var(--green-dim)", border: "1px solid rgba(0,196,140,0.2)",
        borderRadius: "var(--r-md)", marginBottom: "24px",
      }}>
        <span style={{ fontSize: "18px", flexShrink: 0 }}>🎁</span>
        <p style={{ fontSize: "13px", color: "var(--text-2)", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--green)" }}>Free, permanent, and non-revokable.</strong>{" "}
          Issued with <code style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--green)" }}>PARENT_CANNOT_CONTROL</code> burned — WePay can never take it back.
        </p>
      </div>

      {solanaAddress && (
        <div className="fade-up-1" style={{
          display: "flex", gap: "10px", padding: "10px 14px",
          background: "rgba(153,69,255,0.06)", border: "1px solid rgba(153,69,255,0.2)",
          borderRadius: "var(--r-sm)", marginBottom: "24px",
        }}>
          <span style={{ fontSize: "14px", flexShrink: 0 }}>⚡</span>
          <p style={{ fontSize: "12px", color: "var(--text-2)", lineHeight: 1.5 }}>
            <strong style={{ color: "#9945FF" }}>Solana address linked</strong> — will be embedded in your ENS name
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-3)", display: "block", marginTop: "2px" }}>
              {solanaAddress.slice(0, 20)}…{solanaAddress.slice(-6)}
            </span>
          </p>
        </div>
      )}

      <div className="fade-up-2">
        <SubdomainClaimer
          owsVaultAddress={vaultAddress}
          solanaAddress={solanaAddress}
          onClaimed={onClaimed}
        />
      </div>

      <button onClick={onSkip} style={{ marginTop: "16px", background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "var(--text-3)", textDecoration: "underline", padding: 0 }}>
        Skip for now — I'll claim later from the dashboard
      </button>
    </div>
  );
}

// ── Step 4: Setup ──────────────────────────────────────────────────────────

type Bill = { name: string; address: string; amount: string };

function SetupStep({ ensHandle, onComplete }: { ensHandle: string; onComplete: () => void }) {
  const [dailyLimit, setDailyLimit] = useState("500");
  const [bills, setBills] = useState<Bill[]>([]);
  const [showAddBill, setShowAddBill] = useState(false);
  const [newBill, setNewBill] = useState<Bill>({ name: "", address: "", amount: "" });
  const [isSaving, setIsSaving] = useState(false);

  async function handleLaunch() {
    setIsSaving(true);
    try {
      // Save spending policy
      await api.post("/vault/policies", { dailyLimit: parseFloat(dailyLimit) || 500 });
      // Save bills
      for (const bill of bills) {
        await api.post("/payees", {
          name: bill.name,
          address: bill.address,
          category: "other",
          typicalAmount: parseFloat(bill.amount) || undefined,
        });
      }
    } catch {
      // Non-fatal: user can configure from dashboard
    } finally {
      setIsSaving(false);
      onComplete();
    }
  }

  const inputStyle: CSSProperties = {
    width: "100%", padding: "10px 12px",
    background: "var(--bg-2)", border: "1px solid var(--border)",
    borderRadius: "var(--r-sm)", color: "var(--text)",
    fontSize: "14px", outline: "none",
    fontFamily: "var(--font-body)",
  };

  return (
    <div>
      <div className="fade-up" style={{ marginBottom: "32px" }}>
        <div className="badge badge-blue" style={{ marginBottom: "16px" }}>Step 5 of 5</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: "8px" }}>
          Set up your agent
        </h1>
        <p style={{ fontSize: "16px", color: "var(--text-2)", lineHeight: 1.6 }}>
          Connect Telegram, add your bills, and set a daily spending limit. You can always adjust these from the dashboard.
        </p>
      </div>

      {/* ─ Section 1: Telegram ─ */}
      <div className="fade-up-1" style={{ marginBottom: "36px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 700, color: "var(--text)", marginBottom: "6px" }}>
          Connect Telegram
        </h2>
        <p style={{ fontSize: "14px", color: "var(--text-2)", marginBottom: "16px" }}>
          Your AI agent lives here. Type commands in plain English to pay bills, check balance, and manage your vault.
        </p>

        <TelegramConnect />

        {/* Invoice note */}
        <div style={{
          display: "flex", gap: "12px", padding: "14px 16px",
          background: "var(--blue-dim)", border: "1px solid rgba(0,102,255,0.2)",
          borderRadius: "var(--r-md)", marginTop: "12px",
        }}>
          <span style={{ fontSize: "18px", flexShrink: 0 }}>📄</span>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>Invoice payments</p>
            <p style={{ fontSize: "13px", color: "var(--text-2)", lineHeight: 1.6 }}>
              Forward any invoice — PDF, image, or screenshot — to{" "}
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--blue-light)", fontSize: "12px" }}>@wepayethbot</span>.
              The agent reads the amount, recipient, and due date, then asks you to confirm before paying.
            </p>
          </div>
        </div>
      </div>

      {/* ─ Section 2: Virtual card (coming soon) ─ */}
      <div className="fade-up-1" style={{ marginBottom: "36px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 700, color: "var(--text)", margin: 0 }}>
            Virtual card
          </h2>
          <span style={{
            padding: "3px 10px", borderRadius: "999px",
            background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)",
            fontSize: "11px", fontWeight: 600, color: "#f97316", fontFamily: "var(--font-mono)",
          }}>Coming soon</span>
        </div>
        <p style={{ fontSize: "14px", color: "var(--text-2)", marginBottom: "16px", lineHeight: 1.6 }}>
          Pay rent, utilities, and subscriptions with a virtual card funded by your USDC vault — no crypto knowledge needed for merchants. We're evaluating providers including Visa Intelligent Commerce.
        </p>

        <div style={{
          padding: "20px 24px",
          background: "var(--bg-2)", border: "1px dashed rgba(249,115,22,0.3)",
          borderRadius: "var(--r-md)",
          display: "flex", gap: "16px", alignItems: "flex-start",
        }}>
          <div style={{ width: "44px", height: "28px", borderRadius: "6px", background: "linear-gradient(135deg, rgba(249,115,22,0.25) 0%, rgba(249,115,22,0.1) 100%)", border: "1px solid rgba(249,115,22,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>💳</div>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>Virtual Visa / Mastercard</p>
            <p style={{ fontSize: "13px", color: "var(--text-3)", lineHeight: 1.6 }}>
              Your USDC vault funds a virtual card your agent uses to pay any fiat bill, anywhere a card is accepted. We'll notify you when this feature launches.
            </p>
          </div>
        </div>
      </div>

      {/* ─ Section 3: Daily limit ─ */}
      <div className="fade-up-2" style={{ marginBottom: "36px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 700, color: "var(--text)", marginBottom: "6px" }}>
          Daily spending limit
        </h2>
        <p style={{ fontSize: "14px", color: "var(--text-2)", marginBottom: "16px" }}>
          The agent cannot spend more than this per day without your explicit approval — enforced at the wallet layer.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ position: "relative", maxWidth: "220px" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", fontFamily: "var(--font-mono)", fontSize: "16px", pointerEvents: "none" }}>$</span>
            <input
              type="number"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
              style={{ ...inputStyle, paddingLeft: "28px", fontFamily: "var(--font-mono)", fontSize: "18px", fontWeight: 600 }}
            />
          </div>
          <span style={{ fontSize: "14px", color: "var(--text-3)" }}>USDC / day</span>
        </div>
      </div>

      {/* ─ Section 4: Bills ─ */}
      <div className="fade-up-2" style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 700, color: "var(--text)" }}>
            Your bills
          </h2>
          <span style={{ fontSize: "12px", color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>optional</span>
        </div>
        <p style={{ fontSize: "14px", color: "var(--text-2)", marginBottom: "16px" }}>
          Add your recurring payees so the agent knows where to send money. You can also add them later from the dashboard.
        </p>

        {/* Bill list */}
        {bills.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
            {bills.map((bill, i) => (
              <div key={i} className="card" style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px",
              }}>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{bill.name}</p>
                  <p style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-3)" }}>{bill.address}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {bill.amount && <span style={{ fontSize: "13px", fontFamily: "var(--font-mono)", color: "var(--text-2)" }}>${bill.amount}</span>}
                  <button
                    onClick={() => setBills(bills.filter((_, j) => j !== i))}
                    style={{ fontSize: "16px", color: "var(--error)", background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}
                  >×</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add bill form */}
        {showAddBill ? (
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
              {([
                { key: "name"    as const, label: "Bill name",           placeholder: "Electric bill" },
                { key: "address" as const, label: "Address or ENS",      placeholder: "0x... or utility.eth" },
                { key: "amount"  as const, label: "Typical amount ($)",   placeholder: "120" },
              ] as const).map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--text-3)", marginBottom: "4px" }}>{label}</label>
                  <input
                    value={newBill[key]}
                    onChange={(e) => setNewBill({ ...newBill, [key]: e.target.value })}
                    placeholder={placeholder}
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => { setShowAddBill(false); setNewBill({ name: "", address: "", amount: "" }); }}
                className="btn-secondary"
                style={{ flex: 1, padding: "10px 0" }}
              >Cancel</button>
              <button
                onClick={() => {
                  if (newBill.name && newBill.address) {
                    setBills([...bills, newBill]);
                    setNewBill({ name: "", address: "", amount: "" });
                    setShowAddBill(false);
                  }
                }}
                className="btn-primary"
                style={{ flex: 1, padding: "10px 0" }}
              >Add Bill</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddBill(true)}
            style={{
              width: "100%", padding: "12px",
              background: "transparent",
              border: "1px dashed var(--border-2)",
              borderRadius: "var(--r-md)",
              color: "var(--text-3)", fontSize: "14px",
              cursor: "pointer",
              transition: "border-color 0.2s, color 0.2s",
            }}
            onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.borderColor = "var(--blue)"; (e.target as HTMLButtonElement).style.color = "var(--blue-light)"; }}
            onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.borderColor = "var(--border-2)"; (e.target as HTMLButtonElement).style.color = "var(--text-3)"; }}
          >
            + Add a bill
          </button>
        )}
      </div>

      {/* ─ Launch button ─ */}
      <div className="fade-up-3">
        <button
          className="btn-primary"
          onClick={handleLaunch}
          disabled={isSaving}
          style={{ width: "100%", padding: "16px", fontSize: "16px" }}
        >
          {isSaving ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <span className="spinner" style={{ width: "18px", height: "18px", borderWidth: "2px" }} />
              Saving...
            </span>
          ) : ensHandle ? (
            `Launch Dashboard — ${ensHandle}.wepay.eth`
          ) : (
            "Launch Dashboard"
          )}
        </button>
        <p style={{ fontSize: "12px", color: "var(--text-3)", textAlign: "center", marginTop: "10px" }}>
          You can configure bills, limits, and payees anytime from the dashboard.
        </p>
      </div>
    </div>
  );
}

// ── Root onboard page ──────────────────────────────────────────────────────

export default function OnboardPage() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const router = useRouter();
  const [step, setStep] = useState<Step>("subscribe");
  const [vaultAddress, setVaultAddress] = useState<`0x${string}`>("0x");
  const [solanaAddress, setSolanaAddress] = useState("");
  const [ensHandle, setEnsHandle] = useState("");
  const [authState, setAuthState] = useState<"pending" | "done" | "error">("pending");

  // SIWE — sign in once wallet is connected, skip if token already exists
  useEffect(() => {
    if (!isConnected || !address || !walletClient) return;
    if (getAuthToken()) { setAuthState("done"); return; }

    signInWithEthereum(walletClient, address, chainId)
      .then((token) => { setAuthToken(token); setAuthState("done"); })
      .catch(() => setAuthState("error"));
  }, [isConnected, address, walletClient, chainId]);

  // Wallet not connected guard
  if (!isConnected) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "24px", padding: "32px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>💸</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 800, color: "var(--text)", marginBottom: "8px" }}>
            Connect your wallet first
          </h1>
          <p style={{ fontSize: "15px", color: "var(--text-2)", marginBottom: "28px" }}>
            WePay uses your wallet address as your account identifier.
          </p>
          <ConnectButton label="Connect Wallet" />
        </div>
        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "var(--text-3)", textDecoration: "underline" }}>
          ← Back to home
        </button>
      </div>
    );
  }

  // SIWE pending — show brief spinner while wallet signs
  if (authState === "pending") {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
        <span className="spinner" style={{ width: "32px", height: "32px", borderWidth: "3px" }} />
        <p style={{ fontSize: "14px", color: "var(--text-2)" }}>Signing in with your wallet…</p>
      </div>
    );
  }

  // SIWE failed — let user retry
  if (authState === "error") {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "32px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>❌</div>
          <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)", marginBottom: "8px" }}>Signature failed</p>
          <p style={{ fontSize: "14px", color: "var(--text-2)", marginBottom: "24px" }}>Please sign the message in your wallet to continue.</p>
          <button
            className="btn-primary"
            onClick={() => { setAuthState("pending"); }}
            style={{ padding: "12px 28px" }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* ── Nav ─────────────────────────────────────────────────────── */}
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
        <ConnectButton accountStatus="avatar" chainStatus="none" showBalance={false} />
      </nav>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <main style={{ maxWidth: "640px", margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Step bar */}
        <div style={{ marginBottom: "48px" }}>
          <StepBar current={step} />
        </div>

        {/* Step content */}
        {step === "subscribe" && (
          <SubscribeStep
            userId={address}
            onSuccess={() => setStep("vault")}
          />
        )}

        {step === "vault" && (
          <VaultStep
            onComplete={(addr) => {
              setVaultAddress(addr as `0x${string}`);
              setStep("solana");
            }}
          />
        )}

        {step === "solana" && (
          <SolanaWalletStep
            onComplete={(addr) => {
              setSolanaAddress(addr);
              setStep("ens");
            }}
            onSkip={() => setStep("ens")}
          />
        )}

        {step === "ens" && (
          <EnsStep
            vaultAddress={vaultAddress}
            solanaAddress={solanaAddress || undefined}
            onClaimed={(handle) => {
              setEnsHandle(handle);
              setStep("setup");
            }}
            onSkip={() => setStep("setup")}
          />
        )}

        {step === "setup" && (
          <SetupStep
            ensHandle={ensHandle}
            onComplete={() => router.push("/dashboard/")}
          />
        )}
      </main>
    </div>
  );
}
