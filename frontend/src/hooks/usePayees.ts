"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

type Payee = {
  id: string;
  name: string;
  address: string;
  category: string;
  typicalAmount?: number;
  currency: string;
  chain: string;
  notes?: string;
};

export function usePayees() {
  return useQuery<Payee[]>({
    queryKey: ["payees"],
    queryFn: () => api.get("/payees"),
  });
}
