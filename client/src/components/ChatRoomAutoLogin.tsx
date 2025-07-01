import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useEffect, useState } from 'react';

interface ChatRoomAutoLoginProps {
  chatUrl?: string;
  className?: string;
}

export function ChatRoomAutoLogin({ 
  chatUrl = "https://chat.whatsapp.com/deephouseradio", 
  className = "" 
}: ChatRoomAutoLoginProps) {
  const { permissions, isLoading } = useUserPermissions();
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);

  useEffect(() => {
    // Only attempt auto-login for DHR1+ subscribers who can auto-login to chat
    if (!isLoading && permissions.canAutoSignInChat && !autoLoginAttempted) {
      setAutoLoginAttempted(true);
      
      // Log the auto-login attempt
      console.log('Auto-login to chatroom for DHR1+ subscriber:', permissions.subscriptionTier);
      
      // Delay to ensure user sees the interface before redirect
      setTimeout(() => {
        // Auto-open chat in new window
        window.open(chatUrl, '_blank', 'width=400,height=600,scrollbars=yes,resizable=yes');
      }, 2000);
    }
  }, [isLoading, permissions.canAutoSignInChat, autoLoginAttempted, chatUrl]);

  // Don't render anything if user is not authenticated or doesn't have auto-login privilege
  if (isLoading || !permissions.authenticated || !permissions.canAutoSignInChat) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 rounded-lg shadow-lg ${className}`}>
      <div className="flex items-center gap-3">
        <div className="text-2xl">💬</div>
        <div>
          <h3 className="font-bold text-lg">DHR1+ Subscriber Benefit</h3>
          <p className="text-sm opacity-90">
            Automatic chatroom access activated! 
            {!autoLoginAttempted && " Opening in 2 seconds..."}
          </p>
        </div>
        {autoLoginAttempted && (
          <button
            onClick={() => window.open(chatUrl, '_blank', 'width=400,height=600,scrollbars=yes,resizable=yes')}
            className="ml-auto bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-md transition-all"
          >
            Open Chat
          </button>
        )}
      </div>
    </div>
  );
}

interface ChatRoomStatusProps {
  className?: string;
}

export function ChatRoomStatus({ className = "" }: ChatRoomStatusProps) {
  const { permissions, isLoading } = useUserPermissions();

  if (isLoading) {
    return (
      <div className={`animate-pulse bg-slate-200 h-16 rounded-lg ${className}`} />
    );
  }

  if (!permissions.authenticated) {
    return (
      <div className={`bg-slate-100 border border-slate-300 p-4 rounded-lg ${className}`}>
        <div className="flex items-center gap-3">
          <div className="text-2xl">🔒</div>
          <div>
            <h3 className="font-semibold text-slate-700">Chatroom Access</h3>
            <p className="text-sm text-slate-600">Login required to access community chat</p>
          </div>
        </div>
      </div>
    );
  }

  if (permissions.canAutoSignInChat) {
    return <ChatRoomAutoLogin className={className} />;
  }

  return (
    <div className={`bg-slate-100 border border-slate-300 p-4 rounded-lg ${className}`}>
      <div className="flex items-center gap-3">
        <div className="text-2xl">💬</div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-700">Community Chatroom</h3>
          <p className="text-sm text-slate-600 mb-2">
            Join our active community! DHR1+ subscribers get automatic access.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-slate-200 px-2 py-1 rounded-full">
              Current: {permissions.subscriptionTier?.toUpperCase() || 'FREE'}
            </span>
            {permissions.subscriptionStatus === 'expired' && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                Expired
              </span>
            )}
          </div>
        </div>
        <div className="text-center">
          <button
            onClick={() => window.open('https://www.patreon.com/deephouseradio', '_blank')}
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-md transition-colors"
          >
            Upgrade
          </button>
        </div>
      </div>
    </div>
  );
}