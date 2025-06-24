import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    // Get Patreon credentials from environment variables
    const patreonClientId = Deno.env.get('VITE_PATREON_CLIENT_ID')
    const patreonClientSecret = Deno.env.get('VITE_PATREON_CLIENT_SECRET')
    const patreonRedirectUri = Deno.env.get('VITE_PATREON_REDIRECT_URI')

    console.log('Environment check:', {
      clientId: patreonClientId ? 'Set' : 'Missing',
      clientSecret: patreonClientSecret ? 'Set' : 'Missing',
      redirectUri: patreonRedirectUri ? 'Set' : 'Missing'
    })

    // Check if credentials are configured
    if (!patreonClientId || !patreonClientSecret || !patreonRedirectUri) {
      console.error('Missing Patreon credentials in environment variables')
      return new Response(
        JSON.stringify({
          success: false,
          error: "server_error",
          error_description: "Patreon credentials not configured on server"
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // Check for placeholder values
    if (patreonClientId === 'your_patreon_client_id_here' || 
        patreonClientSecret === 'your_patreon_client_secret_here') {
      console.error('Patreon credentials are still placeholder values')
      return new Response(
        JSON.stringify({
          success: false,
          error: "server_error",
          error_description: "Patreon credentials are placeholder values"
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    if (req.method === "POST") {
      const { code, state, redirectUri } = await req.json()

      console.log('Token exchange request:', {
        code: code ? 'Present' : 'Missing',
        state: state ? 'Present' : 'Missing',
        redirectUri: redirectUri || 'Not provided'
      })

      if (!code || !state) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "invalid_request",
            error_description: "Missing code or state parameter"
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        )
      }

      // Use the redirect URI from the request or fall back to environment variable
      const finalRedirectUri = redirectUri || patreonRedirectUri

      console.log('Using redirect URI:', finalRedirectUri)

      // Exchange authorization code for access token
      const tokenData = new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: patreonClientId,
        client_secret: patreonClientSecret,
        redirect_uri: finalRedirectUri,
      })

      console.log('Making token exchange request to Patreon...')

      const tokenResponse = await fetch('https://www.patreon.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenData,
      })

      console.log('Patreon token response status:', tokenResponse.status)

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        console.error('Patreon token exchange failed:', errorText)
        
        return new Response(
          JSON.stringify({
            success: false,
            error: "token_exchange_failed",
            error_description: `Patreon API error: ${tokenResponse.status} ${errorText}`
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        )
      }

      const tokenResult = await tokenResponse.json()
      console.log('Token exchange successful')

      return new Response(
        JSON.stringify({
          success: true,
          access_token: tokenResult.access_token,
          refresh_token: tokenResult.refresh_token,
          expires_in: tokenResult.expires_in,
          scope: tokenResult.scope,
          token_type: tokenResult.token_type
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // Handle GET request for health check
    if (req.method === "GET") {
      return new Response(
        JSON.stringify({
          status: "healthy",
          service: "patreon-oauth",
          configured: true
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "method_not_allowed",
        error_description: "Only POST and GET methods are allowed"
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: "internal_server_error",
        error_description: error instanceof Error ? error.message : "Unknown error occurred"
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})