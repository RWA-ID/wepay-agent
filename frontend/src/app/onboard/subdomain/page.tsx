"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SubdomainClaimer } from "@/components/SubdomainClaimer";

export default function SubdomainPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vaultAddress = searchParams.get("vault") as `0x${string}` | null;

  if (!vaultAddress) {
    if (typeof window !== "undefined") router.replace("/onboard/");
    return null;
  }

  return (
    <main className="min-h-screen px-4 py-12 max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="text-sm font-mono mb-2" style={{ color: "#8b5cf6" }}>STEP 3 OF 4</div>
        <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
          Claim Your ENS Subdomain
        </h1>
        <p className="mt-2" style={{ color: "var(--text-muted)" }}>
          Your financial identity on the blockchain. Free, permanent, and only yours.
        </p>
      </div>

      <SubdomainClaimer
        owsVaultAddress={vaultAddress}
        onClaimed={(handle) => {
          router.push(`/onboard/connect/?handle=${handle}`);
        }}
      />

      <button
        onClick={() => router.push("/onboard/connect/")}
        className="mt-4 text-sm underline"
        style={{ color: "var(--text-muted)" }}
      >
        Skip for now
      </button>
    </main>
  );
}
