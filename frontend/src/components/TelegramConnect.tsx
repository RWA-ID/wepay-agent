"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

type StatusData = { telegram: { connected: boolean } };
type LinkData = { link: string; expiresInMinutes: number };

export function TelegramConnect() {
  const qc = useQueryClient();
  const [link, setLink] = useState<string | null>(null);

  const { data: status } = useQuery<StatusData>({
    queryKey: ["messaging-status"],
    queryFn: () => api.get("/messaging/status"),
  });

  const generateLink = useMutation({
    mutationFn: () => api.post<LinkData>("/messaging/telegram/link", {}),
    onSuccess: (data) => setLink(data.link),
  });

  const disconnect = useMutation({
    mutationFn: () => api.delete("/messaging/telegram"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["messaging-status"] }); setLink(null); },
  });

  const isConnected = status?.telegram.connected;

  return (
    <div className="p-5 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✈️</span>
          <div>
            <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Telegram</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              {isConnected ? "Connected — agent active" : "Not connected"}
            </div>
          </div>
        </div>
        {isConnected && (
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
            ✓ Live
          </span>
        )}
      </div>

      {isConnected ? (
        <button
          onClick={() => disconnect.mutate()}
          className="text-xs underline"
          style={{ color: "var(--text-muted)" }}
        >
          Disconnect
        </button>
      ) : link ? (
        <div>
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
            Click the link below to open Telegram and connect your agent. Expires in 15 minutes.
          </p>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 rounded-xl text-center text-sm font-semibold text-white"
            style={{ background: "#0088cc" }}
          >
            Open Telegram Bot →
          </a>
        </div>
      ) : (
        <button
          onClick={() => generateLink.mutate()}
          disabled={generateLink.isPending}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "#0088cc" }}
        >
          {generateLink.isPending ? "Generating link..." : "Connect Telegram"}
        </button>
      )}
    </div>
  );
}
