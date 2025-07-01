import { useQuery } from '@tanstack/react-query';
import { AccessPermissions } from '@/utils/accessControl';

interface UserPermissionsResponse extends AccessPermissions {
  authenticated: boolean;
  subscriptionTier?: string;
  subscriptionStatus?: string;
  subscriptionExpiry?: string | null;
  subscriptionExpired?: boolean;
  remainingDownloads?: number;
}

export function useUserPermissions() {
  const { data, isLoading, error } = useQuery<UserPermissionsResponse>({
    queryKey: ['/api/user/permissions'],
    retry: false,
  });

  return {
    permissions: data || {
      canAccessDHR1: false,
      canAccessDHR2: false,
      canAccessVIP: false,
      canComment: false,
      canDownload: false,
      canAutoSignInChat: false,
      dailyDownloadLimit: 0,
      authenticated: false,
    },
    isLoading,
    error,
    isAuthenticated: data?.authenticated || false,
    subscriptionExpired: data?.subscriptionExpired || false,
  };
}