import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Calendar, User, Mail, Clock, Crown, Shield } from "lucide-react";

interface UserData {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  subscriptionTier: string;
  subscriptionStatus: string;
  subscriptionExpiry: Date | null;
  subscriptionSource: string | null;
  isAdmin: boolean | null;
  createdAt: Date | null;
  lastLoginAt: Date | null;
}

export default function AdminUserManagement() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState("");
  const [expiryDays, setExpiryDays] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated,
  });

  const assignTierMutation = useMutation({
    mutationFn: async ({ email, tier, expiryDays }: { email: string; tier: string; expiryDays: number }) => {
      const response = await fetch("/api/admin/assign-tier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tier, expiryDays }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to assign tier");
      }
      return response.json();
    },
    onSuccess: () => {
      setStatusMessage("User tier assigned successfully");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEmail("");
      setTier("");
      setExpiryDays("");
      setTimeout(() => setStatusMessage(""), 3000);
    },
    onError: (error: any) => {
      if (error.message?.includes("401")) {
        setStatusMessage("Unauthorized - redirecting to login...");
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1000);
        return;
      }
      setStatusMessage(`Error: ${error.message}`);
      setTimeout(() => setStatusMessage(""), 5000);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-orange-900/20 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-orange-900/20 to-black flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 border border-orange-500/20">
          <h2 className="text-2xl font-bold text-white text-center mb-4">Authentication Required</h2>
          <p className="text-gray-300 text-center mb-6">Please sign in to access admin features.</p>
          <button 
            onClick={() => window.location.href = "/api/login"}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded"
          >
            Sign In With Replit
          </button>
        </div>
      </div>
    );
  }

  const handleAssignTier = () => {
    if (!email || !tier) {
      setStatusMessage("Please fill in email and tier");
      setTimeout(() => setStatusMessage(""), 3000);
      return;
    }

    const expiryDaysNum = expiryDays ? parseInt(expiryDays) : 0;
    assignTierMutation.mutate({ email, tier, expiryDays: expiryDaysNum });
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "vip": return "bg-yellow-500 text-black";
      case "dhr2": return "bg-amber-500 text-black";
      case "dhr1": return "bg-orange-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500 text-white";
      case "inactive": return "bg-red-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-orange-900/20 to-black p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-white">Admin User Management</h1>
          </div>
          <div className="bg-orange-500 text-black px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Admin Access
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`mb-6 p-4 rounded-lg ${statusMessage.includes("Error") ? "bg-red-900/50 border border-red-500" : "bg-green-900/50 border border-green-500"}`}>
            <p className="text-white">{statusMessage}</p>
          </div>
        )}

        {/* Manual Tier Assignment */}
        <div className="mb-8 bg-gray-800/50 border border-orange-500/20 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <User className="h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-bold text-white">Manual Tier Assignment</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-gray-300 mb-2 block">User Email</label>
              <input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Subscription Tier</label>
              <select 
                value={tier} 
                onChange={(e) => setTier(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:border-orange-500 focus:outline-none"
              >
                <option value="">Select tier</option>
                <option value="free">Free</option>
                <option value="dhr1">DHR1 (€3)</option>
                <option value="dhr2">DHR2 (€5)</option>
                <option value="vip">VIP (€10)</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Expiry (Days)</label>
              <input
                type="number"
                placeholder="30"
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <button 
                onClick={handleAssignTier}
                disabled={assignTierMutation.isPending}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded"
              >
                {assignTierMutation.isPending ? "Assigning..." : "Assign Tier"}
              </button>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-gray-800/50 border border-orange-500/20 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <User className="h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-bold text-white">All Users ({Array.isArray(users) ? users.length : 0})</h2>
          </div>

          {usersLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-300">Loading users...</p>
            </div>
          ) : !Array.isArray(users) || users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-300">No users found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((userItem: UserData) => (
                <div
                  key={userItem.id}
                  className="bg-gray-700/50 rounded-lg p-4 border border-gray-600"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                        {userItem.isAdmin ? (
                          <Crown className="h-5 w-5 text-black" />
                        ) : (
                          <User className="h-5 w-5 text-black" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-white font-medium">
                          {userItem.firstName && userItem.lastName 
                            ? `${userItem.firstName} ${userItem.lastName}`
                            : userItem.email || "Unknown User"
                          }
                        </h3>
                        <p className="text-gray-400 text-sm">ID: {userItem.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getTierBadgeColor(userItem.subscriptionTier)}`}>
                        {userItem.subscriptionTier.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(userItem.subscriptionStatus)}`}>
                        {userItem.subscriptionStatus}
                      </span>
                      {userItem.isAdmin && (
                        <span className="bg-purple-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                          <Crown className="h-3 w-3" />
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Mail className="h-4 w-4" />
                      <span>{userItem.email || "No email"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Expires: {userItem.subscriptionExpiry 
                          ? new Date(userItem.subscriptionExpiry).toLocaleDateString()
                          : "No expiry"
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Clock className="h-4 w-4" />
                      <span>
                        Source: {userItem.subscriptionSource || "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}