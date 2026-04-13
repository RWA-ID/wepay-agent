"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

type StatusData = { whatsapp: { connected: boolean } };

export function WhatsAppConnect() {
  const qc = useQueryClient();

  const { data: status } = useQuery<StatusData>({
    queryKey: ["messaging-status"],
    queryFn: () => api.get("/messaging/status"),
  });

  const disconnect = useMutation({
    mutationFn: () => api.delete("/messaging/whatsapp"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messaging-status"] }),
  });

  const isConnected = status?.whatsapp.connected;

  return (
    <div className="p-5 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💬</span>
          <div>
            <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>WhatsApp</div>
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
      ) : (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          WhatsApp connection is set up via the backend. Contact support or check your dashboard for the QR code link.
        </p>
      )}
    </div>
  );
}
