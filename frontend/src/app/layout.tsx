"use client";

import "./globals.css";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { wagmiConfig } from "@/lib/wagmi";
import { useState, useEffect } from "react";
import { ThemeContext, type Theme } from "@/lib/theme";

// ── Root layout ────────────────────────────────────────────────────────────

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [theme, setTheme] = useState<Theme>("dark");

  // Persist theme preference
  useEffect(() => {
    const saved = localStorage.getItem("wepay-theme") as Theme | null;
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("wepay-theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <title>WePay — Your Personal AI Payment Agent</title>
        <meta name="description" content="Pay your bills with natural language. Non-custodial. ENS-native. Powered by AI." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="WePay — Your Personal AI Payment Agent" />
        <meta property="og:description" content="Set up your bills once. Message your AI agent to pay them." />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💸</text></svg>" />
      </head>
      <body>
        <ThemeContext.Provider value={{ theme, toggle }}>
          <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
              <RainbowKitProvider
                theme={theme === "dark"
                  ? darkTheme({ accentColor: "#0066FF", accentColorForeground: "white", borderRadius: "medium" })
                  : lightTheme({ accentColor: "#0066FF", accentColorForeground: "white", borderRadius: "medium" })
                }
              >
                {children}
              </RainbowKitProvider>
            </QueryClientProvider>
          </WagmiProvider>
        </ThemeContext.Provider>
      </body>
    </html>
  );
}
