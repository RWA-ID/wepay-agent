"use client";

import { HelioCheckout as HelioWidget } from "@heliofi/checkout-react";
import { useTheme } from "@/lib/theme";

type Props = {
  userId?: string;
  onSuccess?: (transactionId: string) => void;
};

const PAYLINK_ID = process.env.NEXT_PUBLIC_HELIO_PAYLINK_ID!;

export function HelioCheckout({ userId, onSuccess }: Props) {
  const { theme } = useTheme();

  const config = {
    paylinkId:       PAYLINK_ID,
    display:         "inline" as const,
    stretchFullWidth: true,
    primaryColor:    "#6400CC",
    neutralColor:    "#5A6578",
    theme:           { themeMode: theme === "dark" ? "dark" : "light" } as { themeMode: "dark" | "light" },
    // Pass userId so it appears in the webhook payload
    additionalJSON:  userId ? { userId } : undefined,
    onSuccess: (event: { transaction: string }) => {
      onSuccess?.(event.transaction);
    },
    onError: (event: unknown) => {
      console.error("Helio checkout error", event);
    },
  };

  return (
    <div style={{
      width: "100%",
      maxWidth: "440px",
      margin: "0 auto",
      borderRadius: "var(--r-lg)",
      overflow: "hidden",
      border: "1px solid var(--border)",
    }}>
      <HelioWidget config={config} />
    </div>
  );
}
