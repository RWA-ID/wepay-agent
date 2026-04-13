"use client";

import { PolicyEditor } from "@/components/PolicyEditor";
import { api } from "@/lib/api";

export default function SettingsPage() {
  async function handleSave(data: unknown) {
    await api.post("/vault/policies", data);
    alert("Spending limits updated!");
  }

  return (
    <main className="min-h-screen px-4 py-12 max-w-3xl mx-auto">
      <div className="mb-8">
        <a href="/dashboard/" className="text-sm mb-4 inline-block" style={{ color: "var(--text-muted)" }}>
          ← Dashboard
        </a>
        <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Settings</h1>
        <p className="mt-2" style={{ color: "var(--text-muted)" }}>
          Update your spending limits and vault settings.
        </p>
      </div>
      <PolicyEditor onSave={handleSave} />
    </main>
  );
}
