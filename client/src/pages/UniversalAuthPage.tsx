import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import SharedBackground from "@/components/SharedBackground";

export default function UniversalAuthPage() {
  const [, setLocation] = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { 
    user, 
    isAuthenticated, 
    isLoading,
    googleSignIn, 
    appleSignIn, 
    emailSignIn, 
    emailSignUp 
  } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      setLocation("/");
    }
  }, [isAuthenticated, user, isLoading, setLocation]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        await emailSignUp.mutateAsync({ email, password });
      } else {
        await emailSignIn.mutateAsync({ email, password });
      }
      setLocation("/");
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await googleSignIn.mutateAsync();
      setLocation("/");
    } catch (err: any) {
      setError(err.message || "Google sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await appleSignIn.mutateAsync();
      setLocation("/");
    } catch (err: any) {
      setError(err.message || "Apple sign in failed");
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <SharedBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <SharedBackground />
      
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/">
              <div className="text-4xl font-black text-white mb-2 cursor-pointer hover:text-orange-400 transition-colors">
                DHR
              </div>
            </Link>
            <div className="text-xl text-orange-400 font-medium mb-6">
              DEEP HOUSE RADIO
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="text-gray-300">
              {isSignUp 
                ? "Join the deep house community" 
                : "Sign in to access premium content"
              }
            </p>
          </div>

          {/* Auth Card */}
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* OAuth Buttons - Temporarily disabled until Firebase Console configuration */}
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-orange-500/20 border border-orange-500/50 rounded-lg text-orange-300 text-sm text-center">
                <p className="font-medium mb-2">OAuth Setup Required</p>
                <p>Google and Apple sign-in need to be configured in Firebase Console. Using email authentication for now.</p>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : (isSignUp ? "Create Account" : "Sign In")}
              </button>
            </form>

            {/* Switch between Sign In / Sign Up */}
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                  setEmail("");
                  setPassword("");
                }}
                className="text-orange-400 hover:text-orange-300 text-sm"
              >
                {isSignUp 
                  ? "Already have an account? Sign in" 
                  : "Don't have an account? Create one"
                }
              </button>
            </div>

            {/* Subscription Info */}
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300 text-center">
                Sign in to access your subscription tier and premium content. 
                We verify active Patreon and Buy Me a Coffee subscriptions automatically.
              </p>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-6">
            <Link href="/">
              <span className="text-gray-400 hover:text-white text-sm cursor-pointer">
                ← Back to Deep House Radio
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}