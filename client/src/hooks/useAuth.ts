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

  // Check session-based authentication with proper error handling
  const { data: user, isLoading: authLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    // Return null for 401 errors instead of throwing
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: 'include', // Important for session cookies
        });
        
        if (response.status === 401) {
          return null; // Not authenticated
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response.json();
      } catch (error) {
        console.error("Auth check failed:", error);
        return null;
      }
    }
  });

  // Simple email authentication
  const emailSignIn = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const response = await fetch("/api/auth/simple-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include', // Important for session cookies
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        throw new Error(`Login failed: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Login successful, invalidating auth cache:", data);
      // Force refetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
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

  // Debug logging
  console.log("useAuth state:", {
    user,
    isLoading,
    isAuthenticated,
    error
  });

  return {
    user: user as AuthUser | undefined,
    isLoading,
    isAuthenticated,
    emailSignIn,
    signOut,
  };
}