import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AuthUser {
  id: string;
  email: string;
  username?: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  subscriptionExpiry?: Date;
  isAdmin: boolean;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

export function useAuth() {
  const queryClient = useQueryClient();

  // Check session-based authentication
  const { data: user, isLoading: authLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Simple email authentication
  const emailSignIn = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const response = await apiRequest("POST", "/api/auth/simple-login", { email });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: Error) => {
      console.error("Email sign in failed:", error);
    },
  });

  // Sign Out
  const signOut = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      return response;
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });

  const isLoading = authLoading;
  const isAuthenticated = !!user;

  return {
    user: user as AuthUser | undefined,
    isLoading,
    isAuthenticated,
    emailSignIn,
    signOut,
  };
}