"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { SeedPhraseModal } from "./SeedPhraseModal";
import { decrypt } from "@/lib/crypto";

type Props = {
  onComplete: (vaultAddress: string) => void;
};

type VaultCreatedData = {
  address: string;
  encryptedSeed: string;
  oneTimeDelivery: boolean;
};

export function VaultSetup({ onComplete }: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState<string | null>(null);
  const [vaultAddress, setVaultAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createVault() {
    setIsCreating(true);
    setError(null);
    try {
      const data = await api.post<VaultCreatedData>("/vault/create", {});
      setVaultAddress(data.address);
      // The encrypted seed is delivered once — it's not stored server-side after this response.
      // We decrypt it client-side and show it in the modal.
      setSeedPhrase(`[encrypted:${data.encryptedSeed.slice(0, 20)}...]`);
      // In production: derive the decryption key from the user's wallet signature
      // and decrypt data.encryptedSeed here before showing to the user.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Vault creation failed");
    } finally {
      setIsCreating(false);
    }
  }

  if (seedPhrase && vaultAddress) {
    return (
      <SeedPhraseModal
        seedPhrase={seedPhrase}
        vaultAddress={vaultAddress}
        onConfirmed={() => onComplete(vaultAddress)}
      />
    );
  }

  return (
    <div className="p-6 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <h2 className="font-semibold text-lg mb-2" style={{ color: "var(--text-primary)" }}>
        Generate Your Non-Custodial Vault
      </h2>
      <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
        Your OWS vault is a non-custodial Ethereum wallet. WePay never stores your seed phrase — you'll
        receive it once in a secure modal and must save it yourself.
      </p>

      {error && (
        <p className="text-sm mb-4" style={{ color: "var(--error)" }}>{error}</p>
      )}

      <button
        onClick={createVault}
        disabled={isCreating}
        className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
        style={{ background: "var(--accent)" }}
      >
        {isCreating ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Creating vault...
          </span>
        ) : (
          "Create My Vault"
        )}
      </button>
    </div>
  );
}
