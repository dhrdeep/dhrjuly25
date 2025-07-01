import { useQuery } from '@tanstack/react-query';
import { getAccessPermissions, AccessTier } from '@/utils/accessControl';
import { User } from '@shared/schema';
import { AlertCircle, Lock } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredTier: AccessTier;
  fallbackMessage?: string;
}

export function ProtectedRoute({ children, requiredTier, fallbackMessage }: ProtectedRouteProps) {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-slate-400 mb-4">
              You need to be logged in to access this page
            </p>
            <button 
              onClick={() => window.location.href = '/api/login'}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Login with Patreon
            </button>
          </div>
        </div>
      </div>
    );
  }

  const permissions = getAccessPermissions(user);

  // Check specific access based on required tier
  let hasAccess = false;
  switch (requiredTier) {
    case 'dhr1':
      hasAccess = permissions.canAccessDHR1;
      break;
    case 'dhr2':
      hasAccess = permissions.canAccessDHR2;
      break;
    case 'vip':
      hasAccess = permissions.canAccessVIP;
      break;
    case 'free':
      hasAccess = true;
      break;
  }

  if (!hasAccess) {
    const tierNames = {
      dhr1: 'DHR1 (€3/month)',
      dhr2: 'DHR2 (€5/month)',
      vip: 'VIP (€10/month)'
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-orange-500" />
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">Subscription Required</h2>
            <p className="text-slate-400 mb-4">
              {fallbackMessage || `You need a ${tierNames[requiredTier as keyof typeof tierNames]} subscription to access this page`}
            </p>
            <div className="text-sm text-slate-400 text-center mb-4">
              Current tier: <span className="text-white">{user.subscriptionTier}</span>
            </div>
            <div className="text-center space-y-2">
              <button 
                onClick={() => window.open('https://patreon.com/deephouseradio', '_blank')}
                className="bg-orange-600 hover:bg-orange-700 text-white w-full px-4 py-2 rounded-md transition-colors"
              >
                Upgrade on Patreon
              </button>
              <button 
                onClick={() => window.history.back()}
                className="border border-slate-600 text-slate-300 hover:bg-slate-700 w-full px-4 py-2 rounded-md transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}