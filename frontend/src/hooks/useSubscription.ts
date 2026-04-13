"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getAuthToken } from "@/lib/api";

type SubscriptionData = {
  hasAccess: boolean;
  daysRemaining: number;
  expiresAt: string | null;
};

export function useSubscription() {
  const token = getAuthToken();

  const { data, isLoading } = useQuery<SubscriptionData>({
    queryKey: ["subscription"],
    queryFn: () => api.get("/vault"),  // If vault returns data, user is authenticated + has access
    enabled: !!token,
    retry: false,
  });

  return {
    hasAccess: !!data,
    isLoading,
    daysRemaining: 0,
    expiresAt: null,
  };
}
