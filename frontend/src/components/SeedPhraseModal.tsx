"use client";

import { useState } from "react";

type Props = {
  seedPhrase: string;
  vaultAddress: string;
  onConfirmed: () => void;
};

export function SeedPhraseModal({ seedPhrase, vaultAddress, onConfirmed }: Props) {
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyToClipboard() {
    await navigator.clipboard.writeText(seedPhrase);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
      <div className="max-w-lg w-full rounded-2xl p-8"
        style={{ background: "var(--bg-card)", border: "1px solid rgba(239,68,68,0.5)" }}>

        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">🔐</span>
          <div>
            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              Save Your Seed Phrase
            </h2>
            <p className="text-sm" style={{ color: "var(--error)" }}>
              This will only be shown once. We do not store it.
            </p>
          </div>
        </div>

        {/* Vault address */}
        <div className="p-3 rounded-lg mb-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
          <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Your vault address</div>
          <div className="text-sm font-mono break-all" style={{ color: "var(--text-primary)" }}>{vaultAddress}</div>
        </div>

        {/* Seed phrase */}
        <div className="p-4 rounded-lg mb-4 relative" style={{ background: "#1a0a0a", border: "1px solid rgba(239,68,68,0.3)" }}>
          <div className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>Seed phrase (24 words)</div>
          <div className="text-sm font-mono leading-7 break-words select-all" style={{ color: "#f87171" }}>
            {seedPhrase}
          </div>
          <button
            onClick={copyToClipboard}
            className="absolute top-3 right-3 text-xs px-2 py-1 rounded transition-all"
            style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <p className="text-xs mb-6" style={{ color: "var(--text-muted)" }}>
          Write it down on paper. Do not screenshot. Do not store in email or cloud notes.
          Anyone with these words has full access to your vault.
        </p>

        <label className="flex items-center gap-3 cursor-pointer mb-6">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm" style={{ color: "var(--text-primary)" }}>
            I have saved my seed phrase in a safe location
          </span>
        </label>

        <button
          onClick={onConfirmed}
          disabled={!confirmed}
          className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-40"
          style={{ background: confirmed ? "var(--accent)" : "var(--border)" }}
        >
          Continue to Spending Limits
        </button>
      </div>
    </div>
  );
}
