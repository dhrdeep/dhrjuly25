import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Crown, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { patreonService } from '../services/patreonService';

const DHR_LOGO_URL = 'https://static.wixstatic.com/media/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png/v1/fill/w_292,h_292,al_c,q_95,usm_0.66_1.00_0.01,enc_avif,quality_auto/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png';

const PatreonCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [detailedError, setDetailedError] = useState('');

  const handleArtworkError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = DHR_LOGO_URL;
  };

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      console.log('Callback parameters:', { code: code ? '[PRESENT]' : '[MISSING]', state, error, errorDescription });

      if (error) {
        setStatus('error');
        setMessage(`Patreon authorization failed: ${error}`);
        setDetailedError(errorDescription || 'No additional details provided');
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setMessage('Missing authorization code or state parameter');
        setDetailedError('The OAuth callback is missing required parameters. This may indicate an issue with the Patreon OAuth flow.');
        return;
      }

      try {
        setMessage('Exchanging authorization code...');
        const success = await patreonService.exchangeCodeForToken(code, state);
        
        if (success) {
          setStatus('success');
          setMessage('Successfully connected to Patreon! You can now sync your subscribers.');
          
          // Redirect to admin page after 3 seconds
          setTimeout(() => {
            navigate('/admin');
          }, 3000);
        } else {
          setStatus('error');
          setMessage('Failed to exchange authorization code for access token');
          setDetailedError('The token exchange completed but returned an unexpected result.');
        }
      } catch (error) {
        setStatus('error');
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setMessage('Failed to exchange authorization code for access token');
        setDetailedError(errorMessage);
        
        // If the error is related to OAuth state mismatch, clear the stored state
        // to allow for a clean retry without manual browser cleanup
        if (errorMessage.includes('Invalid OAuth state')) {
          localStorage.removeItem('patreon_oauth_state');
          setDetailedError(errorMessage + ' - State has been cleared for retry.');
        }
        
        console.error('Token exchange error:', error);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen text-white flex items-center justify-center py-8 px-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-800/40 backdrop-blur-xl rounded-3xl p-8 border border-orange-400/20 text-center">
          {/* Header */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="relative">
              <img 
                src={DHR_LOGO_URL} 
                alt="DHR Logo"
                className="h-16 w-16 rounded-xl shadow-2xl border-2 border-orange-400/50"
                onError={handleArtworkError}
              />
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full p-2">
                <Crown className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent mb-2">
            Patreon Integration
          </h1>
          
          <p className="text-gray-300 mb-8">
            Connecting your Patreon account to DHR
          </p>

          {/* Status Display */}
          <div className="mb-8">
            {status === 'loading' && (
              <div className="flex flex-col items-center space-y-4">
                <Loader className="h-12 w-12 text-orange-400 animate-spin" />
                <p className="text-orange-300">{message}</p>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
                <div>
                  <p className="text-green-300 font-semibold mb-2">Connection Successful!</p>
                  <p className="text-gray-300 text-sm">{message}</p>
                  <p className="text-gray-400 text-xs mt-2">Redirecting to admin panel...</p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                </div>
                <div>
                  <p className="text-red-300 font-semibold mb-2">Connection Failed</p>
                  <p className="text-gray-300 text-sm mb-2">{message}</p>
                  {detailedError && (
                    <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-3 mt-3">
                      <p className="text-red-200 text-xs font-mono">{detailedError}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {status === 'error' && (
              <button
                onClick={() => navigate('/admin')}
                className="w-full bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 font-semibold py-3 rounded-lg transition-all duration-200 border border-orange-400/30"
              >
                Return to Admin Panel
              </button>
            )}

            {status === 'success' && (
              <button
                onClick={() => navigate('/admin')}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-lg transition-all duration-200"
              >
                Go to Admin Panel
              </button>
            )}
          </div>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-orange-500/10 rounded-lg border border-orange-400/20">
            <p className="text-orange-200 text-sm">
              <strong>Next Steps:</strong> Once connected, you can sync your Patreon subscribers 
              and manage their DHR access levels from the admin panel.
            </p>
          </div>

          {/* Debug Info for Development */}
          {status === 'error' && (
            <div className="mt-4 p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
              <p className="text-gray-400 text-xs mb-2">Debug Information:</p>
              <div className="text-left text-xs font-mono text-gray-300 space-y-1">
                <p>URL: {window.location.href}</p>
                <p>Origin: {window.location.origin}</p>
                <p>Code: {searchParams.get('code') ? '[PRESENT]' : '[MISSING]'}</p>
                <p>State: {searchParams.get('state') || '[MISSING]'}</p>
                <p>Error: {searchParams.get('error') || '[NONE]'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatreonCallbackPage;