"use client";

import { PayeeManager } from "@/components/PayeeManager";

export default function PayeesPage() {
  return (
    <main className="min-h-screen px-4 py-12 max-w-3xl mx-auto">
      <div className="mb-8">
        <a href="/dashboard/" className="text-sm mb-4 inline-block" style={{ color: "var(--text-muted)" }}>
          ← Dashboard
        </a>
        <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Payees</h1>
        <p className="mt-2" style={{ color: "var(--text-muted)" }}>
          Configure recurring payees your agent can pay on your behalf.
        </p>
      </div>
      <PayeeManager />
    </main>
  );
}
