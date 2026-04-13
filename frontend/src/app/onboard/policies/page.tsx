"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PolicyEditor } from "@/components/PolicyEditor";
import { api } from "@/lib/api";

function PoliciesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vaultAddress = searchParams.get("vault");

  async function handleSave(data: Parameters<typeof api.post>[1]) {
    await api.post("/vault/policies", data);
    router.push(`/onboard/subdomain/?vault=${vaultAddress}`);
  }

  return (
    <main className="min-h-screen px-4 py-12 max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="text-sm font-mono mb-2" style={{ color: "#8b5cf6" }}>STEP 2 OF 4</div>
        <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
          Set Spending Limits
        </h1>
        <p className="mt-2" style={{ color: "var(--text-muted)" }}>
          These limits are enforced at the wallet layer — your AI agent cannot exceed them, even if instructed to.
        </p>
      </div>

      <PolicyEditor onSave={handleSave} />

      <button
        onClick={() => router.push(`/onboard/subdomain/?vault=${vaultAddress}`)}
        className="mt-4 text-sm underline"
        style={{ color: "var(--text-muted)" }}
      >
        Skip for now
      </button>
    </main>
  );
}

export default function PoliciesPage() {
  return (
    <Suspense fallback={null}>
      <PoliciesContent />
    </Suspense>
  );
}
