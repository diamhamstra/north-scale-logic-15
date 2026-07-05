import { useQuery } from "@tanstack/react-query";
import { loadInvestorProfileForUser } from "@/lib/investorProfile";
import { base44 } from "@/api/base44Client";
import { migrateLegacyAuthStorage } from "@/lib/authSync";
import { getSessionUser } from "@/lib/sessionUser";

migrateLegacyAuthStorage();

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: getSessionUser,
    staleTime: 60 * 1000,
    retry: false,
  });
}

export function useInvestorProfile(userId, email) {
  const normalizedEmail = typeof email === "string" ? email.toLowerCase().trim() : "";
  return useQuery({
    queryKey: ["investorProfile", userId, normalizedEmail],
    queryFn: () => loadInvestorProfileForUser(base44, userId, normalizedEmail),
    enabled: !!userId,
    staleTime: 30 * 1000,
    retry: false,
  });
}