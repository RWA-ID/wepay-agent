"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { WEPAY_REGISTRAR_ABI, WEPAY_REGISTRAR_ADDRESS } from "@/lib/constants";
import { api } from "@/lib/api";

type Props = {
  owsVaultAddress: `0x${string}`;
  solanaAddress?: string;
  onClaimed: (handle: string) => void;
};

export function SubdomainClaimer({ owsVaultAddress, solanaAddress, onClaimed }: Props) {
  const [handle, setHandle] = useState("");
  const [availability, setAvailability] = useState<"available" | "taken" | "invalid" | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  async function checkAvailability() {
    if (handle.length < 3) {
      setAvailability("invalid");
      return;
    }
    setIsChecking(true);
    try {
      const data = await api.get<{ available: boolean }>(`/ens/check?handle=${handle.toLowerCase()}`);
      setAvailability(data.available ? "available" : "taken");
    } catch {
      setAvailability(null);
    } finally {
      setIsChecking(false);
    }
  }

  function handleClaim() {
    if (!WEPAY_REGISTRAR_ADDRESS) return;
    // Encode Solana address as bytes — base58 decode to raw 32-byte pubkey
    // If not provided, pass empty bytes (contract skips the Solana record)
    const solanaBytes = solanaAddress
      ? ("0x" + Buffer.from(base58Decode(solanaAddress)).toString("hex")) as `0x${string}`
      : "0x" as `0x${string}`;
    writeContract({
      address: WEPAY_REGISTRAR_ADDRESS,
      abi: WEPAY_REGISTRAR_ABI,
      functionName: "claimSubdomain",
      args: [handle.toLowerCase(), owsVaultAddress, solanaBytes],
    });
  }

  // Minimal base58 decoder for Solana public keys
  function base58Decode(str: string): Uint8Array {
    const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    const bytes = [0];
    for (const char of str) {
      let carry = ALPHABET.indexOf(char);
      if (carry < 0) throw new Error("Invalid base58 character");
      for (let i = 0; i < bytes.length; i++) {
        carry += bytes[i] * 58;
        bytes[i] = carry & 0xff;
        carry >>= 8;
      }
      while (carry > 0) { bytes.push(carry & 0xff); carry >>= 8; }
    }
    for (const char of str) { if (char === "1") bytes.push(0); else break; }
    return new Uint8Array(bytes.reverse());
  }

  if (isSuccess) {
    onClaimed(handle.toLowerCase());
    return (
      <div className="p-6 rounded-xl text-center" style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.3)" }}>
        <div className="text-3xl mb-3">🎉</div>
        <div className="font-semibold mb-1" style={{ color: "#22c55e" }}>
          {handle.toLowerCase()}.wepay.eth is yours!
        </div>
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>
          Permanent. Unrevocable. Yours as long as wepay.eth exists.
        </div>
        <a
          href={`https://app.ens.domains/${handle.toLowerCase()}.wepay.eth`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-xs underline"
          style={{ color: "#8b5cf6" }}
        >
          View on ENS Manager →
        </a>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <div className="flex gap-2 mb-3">
        <input
          value={handle}
          onChange={(e) => { setHandle(e.target.value.toLowerCase()); setAvailability(null); }}
          placeholder="yourname"
          maxLength={32}
          className="flex-1 px-3 py-2 rounded-lg text-sm font-mono outline-none"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
        />
        <span className="flex items-center text-sm whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
          .wepay.eth
        </span>
      </div>

      {/* Availability badge */}
      {availability && (
        <div className="mb-3 text-xs px-2 py-1 rounded inline-flex items-center gap-1"
          style={{
            background: availability === "available" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
            color: availability === "available" ? "#22c55e" : "#ef4444",
          }}>
          {availability === "available" ? "✅ Available" : availability === "invalid" ? "⚠️ Min 3 characters" : "❌ Already taken"}
        </div>
      )}

      {writeError && (
        <div className="mb-3 text-xs" style={{ color: "var(--error)" }}>
          {writeError.message}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={checkAvailability}
          disabled={handle.length < 3 || isChecking}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
        >
          {isChecking ? "Checking..." : "Check"}
        </button>
        <button
          onClick={handleClaim}
          disabled={availability !== "available" || isPending || isConfirming || !WEPAY_REGISTRAR_ADDRESS}
          className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--accent)" }}
        >
          {isPending ? "Confirm in wallet..." : isConfirming ? "Claiming..." : "Claim Free Subdomain"}
        </button>
      </div>

      <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
        Issued with <span className="font-mono" style={{ color: "#8b5cf6" }}>PARENT_CANNOT_CONTROL</span> burned
        — WePay can never revoke or replace it.
      </p>
    </div>
  );
}
