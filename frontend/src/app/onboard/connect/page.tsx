"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TelegramConnect } from "@/components/TelegramConnect";
import { WhatsAppConnect } from "@/components/WhatsAppConnect";

function ConnectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handle = searchParams.get("handle");

  return (
    <main className="min-h-screen px-4 py-12 max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="text-sm font-mono mb-2" style={{ color: "#8b5cf6" }}>STEP 4 OF 4</div>
        <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
          Connect Your Agent
        </h1>
        <p className="mt-2" style={{ color: "var(--text-muted)" }}>
          Link Telegram or WhatsApp so your AI agent can receive and act on your messages.
        </p>
      </div>

      <div className="space-y-4">
        <TelegramConnect />
        <WhatsAppConnect />
      </div>

      <button
        onClick={() => router.push("/dashboard/")}
        className="mt-8 w-full py-4 rounded-xl font-semibold text-white transition-all hover:opacity-90"
        style={{ background: "var(--accent)" }}
      >
        {handle ? `Go to Dashboard — ${handle}.wepay.eth` : "Go to Dashboard"}
      </button>
    </main>
  );
}

export default function ConnectPage() {
  return (
    <Suspense fallback={null}>
      <ConnectContent />
    </Suspense>
  );
}
