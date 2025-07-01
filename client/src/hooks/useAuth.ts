import { useEffect, useState } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authMethods } from "@/lib/firebase";
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
  firebaseUid: string;
}

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const queryClient = useQueryClient();

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = authMethods.onAuthStateChanged((user) => {
      setFirebaseUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync Firebase user with backend user data
  const { data: backendUser, isLoading: backendLoading } = useQuery({
    queryKey: ["/api/auth/firebase-user"],
    enabled: !!firebaseUser,
    retry: false,
  });

  // Google Sign In
  const googleSignIn = useMutation({
    mutationFn: async () => {
      const result = await authMethods.signInWithGoogle();
      const idToken = await result.user.getIdToken();
      
      const response = await apiRequest("POST", "/api/auth/firebase-login", {
        idToken,
        provider: 'google'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/firebase-user"] });
    },
    onError: (error: Error) => {
      console.error("Google sign in failed:", error);
    },
  });

  // Apple Sign In
  const appleSignIn = useMutation({
    mutationFn: async () => {
      const result = await authMethods.signInWithApple();
      const idToken = await result.user.getIdToken();
      
      const response = await apiRequest("POST", "/api/auth/firebase-login", {
        idToken,
        provider: 'apple'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/firebase-user"] });
    },
    onError: (error: Error) => {
      console.error("Apple sign in failed:", error);
    },
  });

  // Email Sign In
  const emailSignIn = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const result = await authMethods.signInWithEmail(email, password);
      const idToken = await result.user.getIdToken();
      
      const response = await apiRequest("POST", "/api/auth/firebase-login", {
        idToken,
        provider: 'email'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/firebase-user"] });
    },
    onError: (error: Error) => {
      console.error("Email sign in failed:", error);
    },
  });

  // Email Sign Up
  const emailSignUp = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const result = await authMethods.signUpWithEmail(email, password);
      const idToken = await result.user.getIdToken();
      
      const response = await apiRequest("POST", "/api/auth/firebase-login", {
        idToken,
        provider: 'email'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/firebase-user"] });
    },
    onError: (error: Error) => {
      console.error("Email sign up failed:", error);
    },
  });

  // Sign Out
  const signOut = useMutation({
    mutationFn: async () => {
      await authMethods.signOut();
      const response = await fetch("/api/auth/logout", { method: "POST" });
      return response;
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });

  const isLoading = authLoading || backendLoading;
  const user = backendUser as AuthUser | undefined;
  const isAuthenticated = !!firebaseUser && !!user;

  return {
    user,
    firebaseUser,
    isLoading,
    isAuthenticated,
    googleSignIn,
    appleSignIn,
    emailSignIn,
    emailSignUp,
    signOut,
  };
}