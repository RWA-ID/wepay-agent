"use client";

import { useEffect, useRef } from "react";
import { MOONPAY_ENV, WEPAY_TREASURY_ADDRESS } from "@/lib/constants";

type Props = {
  userId?: string;
  onSuccess: (transactionId: string) => void;
};

export function MoonPayWidget({ userId, onSuccess }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // MoonPay SDK loaded via <script> in layout.tsx
    const moonpay = (window as Window & { MoonPay?: { init: (config: unknown) => void } }).MoonPay;
    if (!moonpay || !containerRef.current) return;

    moonpay.init({
      flow: "buy",
      environment: MOONPAY_ENV,
      variant: "embedded",
      containerNodeSelector: "#moonpay-widget-container",
      params: {
        apiKey: process.env.NEXT_PUBLIC_MOONPAY_PUBLISHABLE_KEY!,
        currencyCode: "usdc_base",
        baseCurrencyCode: "usd",
        baseCurrencyAmount: "99",
        walletAddress: WEPAY_TREASURY_ADDRESS,
        // externalTransactionId correlates the webhook back to this user
        externalTransactionId: userId ?? crypto.randomUUID(),
        colorCode: "%237C3AED",
        theme: "dark",
        language: "en",
      },
      handlers: {
        onTransactionCompleted: (transaction: { id: string }) => {
          onSuccess(transaction.id);
        },
      },
    });
  }, [userId, onSuccess]);

  return (
    <div
      id="moonpay-widget-container"
      ref={containerRef}
      className="w-full min-h-[500px] rounded-xl overflow-hidden"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    />
  );
}
