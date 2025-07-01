import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Crown, Lock, Music, Zap } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredTier: 'dhr1' | 'dhr2' | 'vip';
  pageName: string;
}

export function ProtectedRoute({ children, requiredTier, pageName }: ProtectedRouteProps) {
  const { permissions, isLoading } = useUserPermissions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Check if user has required access
  const hasAccess = () => {
    switch (requiredTier) {
      case 'dhr1':
        return permissions.canAccessDHR1;
      case 'dhr2':
        return permissions.canAccessDHR2;
      case 'vip':
        return permissions.canAccessVIP;
      default:
        return false;
    }
  };

  const getTierInfo = () => {
    switch (requiredTier) {
      case 'dhr1':
        return {
          name: 'DHR1',
          price: '€3',
          color: 'text-orange-500',
          bgColor: 'bg-orange-500',
          icon: '🎵',
          benefits: ['Access to DHR1 premium channel', 'Automatic chatroom login', 'Comment on forum articles', 'Track identification access']
        };
      case 'dhr2':
        return {
          name: 'DHR2',
          price: '€5',
          color: 'text-amber-500',
          bgColor: 'bg-amber-500',
          icon: '⚡',
          benefits: ['Access to DHR2 exclusive channel', 'All DHR1 benefits', 'Enhanced streaming quality', 'Priority community access']
        };
      case 'vip':
        return {
          name: 'VIP',
          price: '€10',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500',
          icon: '👑',
          benefits: ['Full access to all content', 'VIP music downloads (2 per day)', 'All DHR1 & DHR2 benefits', 'Exclusive VIP content library']
        };
    }
  };

  if (!permissions.authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="text-center">
            <Lock className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Login Required</h1>
            <p className="text-slate-400 mb-6">
              Please log in to access {pageName}
            </p>
            <button 
              onClick={() => window.location.href = '/simple-auth'}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Sign In with Email
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccess()) {
    const tierInfo = getTierInfo();

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-lg p-6">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">{tierInfo.icon}</div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {tierInfo.name} Subscription Required
            </h1>
            <p className="text-slate-400">
              Upgrade to {tierInfo.name} ({tierInfo.price}) to access {pageName}
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg text-white mb-3">What You'll Get:</h3>
              <ul className="space-y-2">
                {tierInfo.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${tierInfo.bgColor}`} />
                    <span className="text-sm text-slate-300">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-slate-700 p-4 rounded-lg">
              <p className="text-sm text-slate-400 mb-2">
                Current Status: {permissions.subscriptionTier?.toUpperCase() || 'FREE'} 
                {permissions.subscriptionStatus === 'expired' && (
                  <span className="text-red-500 ml-2">(Expired)</span>
                )}
              </p>
              {permissions.subscriptionExpiry && (
                <p className="text-xs text-slate-500">
                  Expires: {new Date(permissions.subscriptionExpiry).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => window.open('https://www.patreon.com/deephouseradio', '_blank')}
                className={`w-full ${tierInfo.bgColor} hover:opacity-90 text-white font-medium py-3 px-4 rounded-lg transition-opacity`}
              >
                Upgrade to {tierInfo.name} on Patreon
              </button>
              
              <button 
                onClick={() => window.open('https://buymeacoffee.com/deephouseradio', '_blank')}
                className="w-full border border-amber-500 text-amber-500 hover:bg-amber-50 hover:bg-opacity-10 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Support via Buy Me a Coffee
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}