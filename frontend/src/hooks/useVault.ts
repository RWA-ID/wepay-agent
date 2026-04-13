"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

type VaultData = {
  vaultAddress: string | null;
  vaultCreatedAt: string | null;
  handle: string | null;
};

export function useVault() {
  return useQuery<VaultData>({
    queryKey: ["vault"],
    queryFn: () => api.get("/vault"),
  });
}
