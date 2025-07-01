import { useState } from "react";
import { useLocation } from "wouter";
import SharedBackground from "@/components/SharedBackground";
import { Link } from "wouter";

export default function SimpleAuthPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Simple email-based authentication
      const response = await fetch("/api/auth/simple-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Authentication failed");
      }

      const result = await response.json();
      console.log("Authentication successful:", result);

      // Redirect to home page
      setLocation("/");
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

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
              Email Access
            </h1>
            <p className="text-gray-300">
              Enter your email to access premium content
            </p>
          </div>

          {/* Auth Card */}
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Firebase Setup Notice */}
            <div className="p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-300 text-sm text-center mb-6">
              <p className="font-medium mb-2">Firebase Setup Required</p>
              <p>Go to Firebase Console → Authentication → Sign-in method → Enable Email/Password</p>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter your email (try: test-vip@example.com)"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Checking..." : "Access With Email"}
              </button>
            </form>

            {/* Demo Info */}
            <div className="mt-6 p-4 bg-gray-500/20 border border-gray-500/50 rounded-lg text-gray-300 text-sm">
              <p className="font-medium mb-2">Demo Access:</p>
              <ul className="text-xs space-y-1">
                <li>• Use emails containing 'dhr1' for DHR1 access</li>
                <li>• Use emails containing 'dhr2' for DHR2 access</li>
                <li>• Use emails containing 'vip' for VIP access</li>
              </ul>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center">
              <Link 
                href="/" 
                className="text-orange-400 hover:text-orange-300 text-sm transition-colors"
              >
                ← Back to Deep House Radio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}