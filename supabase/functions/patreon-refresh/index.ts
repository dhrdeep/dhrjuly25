import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface RefreshTokenRequest {
  refresh_token: string;
}

interface PatreonTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    const { refresh_token }: RefreshTokenRequest = await req.json()

    if (!refresh_token) {
      throw new Error('Missing refresh_token parameter')
    }

    // Get Patreon credentials from environment
    const clientId = Deno.env.get('PATREON_CLIENT_ID')
    const clientSecret = Deno.env.get('PATREON_CLIENT_SECRET')

    if (!clientId || !clientSecret) {
      throw new Error('Patreon credentials not configured on server')
    }

    console.log('Refreshing Patreon access token...')

    // Refresh the access token
    const tokenResponse = await fetch('https://www.patreon.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'DHR-Backend/1.0',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })

    console.log('Patreon refresh response status:', tokenResponse.status)

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Patreon token refresh failed:', errorText)
      
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: 'unknown', error_description: errorText }
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorData.error || 'token_refresh_failed',
          error_description: errorData.error_description || 'Failed to refresh access token'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const tokenData: PatreonTokenResponse = await tokenResponse.json()
    console.log('Token refresh successful')

    // Return the new tokens to the client
    return new Response(
      JSON.stringify({
        success: true,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        scope: tokenData.scope,
        token_type: tokenData.token_type
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in patreon-refresh function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'server_error',
        error_description: error instanceof Error ? error.message : 'Unknown server error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})