import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MICROSOFT_CLIENT_ID = Deno.env.get('MICROSOFT_CLIENT_ID')!;
const MICROSOFT_CLIENT_SECRET = Deno.env.get('MICROSOFT_CLIENT_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Microsoft OAuth endpoints
const MICROSOFT_AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const MICROSOFT_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const GRAPH_API_URL = 'https://graph.microsoft.com/v1.0';

// Scopes needed for two-way calendar sync
const SCOPES = [
  'User.Read',
  'Calendars.ReadWrite',  // Changed from Calendars.Read to enable creating events
  'offline_access'
].join(' ');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, code, state } = await req.json();
    
    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        userId = user.id;
      }
    }
    
    switch (action) {
      case 'get_auth_url': {
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Generate OAuth URL with state parameter containing user ID
        const redirectUri = `${SUPABASE_URL}/functions/v1/outlook-calendar-callback`;
        const stateParam = btoa(JSON.stringify({ userId }));
        
        const authUrl = new URL(MICROSOFT_AUTH_URL);
        authUrl.searchParams.set('client_id', MICROSOFT_CLIENT_ID);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('scope', SCOPES);
        authUrl.searchParams.set('state', stateParam);
        authUrl.searchParams.set('response_mode', 'query');
        authUrl.searchParams.set('prompt', 'consent');
        
        return new Response(
          JSON.stringify({ authUrl: authUrl.toString() }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'exchange_code': {
        // Exchange authorization code for tokens
        const redirectUri = `${SUPABASE_URL}/functions/v1/outlook-calendar-callback`;
        
        const tokenResponse = await fetch(MICROSOFT_TOKEN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: MICROSOFT_CLIENT_ID,
            client_secret: MICROSOFT_CLIENT_SECRET,
            code: code,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
          }),
        });
        
        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.text();
          console.error('Token exchange error:', errorData);
          return new Response(
            JSON.stringify({ error: 'Failed to exchange code for tokens' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const tokens = await tokenResponse.json();
        
        // Get user info from Microsoft Graph
        const userInfoResponse = await fetch(`${GRAPH_API_URL}/me`, {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
          },
        });
        
        const userInfo = await userInfoResponse.json();
        
        // Parse state to get user ID
        const stateData = JSON.parse(atob(state));
        const targetUserId = stateData.userId;
        
        // Store tokens in booster_profiles
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        // Store tokens securely (refresh token for long-term access)
        const tokenData = {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: Date.now() + (tokens.expires_in * 1000),
          email: userInfo.mail || userInfo.userPrincipalName,
        };
        
        const { error: updateError } = await supabase
          .from('booster_profiles')
          .update({
            calendar_provider: 'outlook',
            calendar_sync_token: JSON.stringify(tokenData),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', targetUserId);
        
        if (updateError) {
          console.error('Error storing tokens:', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to store calendar connection' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            email: userInfo.mail || userInfo.userPrincipalName 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'disconnect': {
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        const { error } = await supabase
          .from('booster_profiles')
          .update({
            calendar_provider: null,
            calendar_sync_token: null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
        
        if (error) {
          console.error('Error disconnecting calendar:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to disconnect calendar' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'get_status': {
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        const { data: profile, error } = await supabase
          .from('booster_profiles')
          .select('calendar_provider, calendar_sync_token')
          .eq('user_id', userId)
          .single();
        
        if (error || !profile) {
          return new Response(
            JSON.stringify({ connected: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        if (profile.calendar_provider === 'outlook' && profile.calendar_sync_token) {
          try {
            const tokenData = JSON.parse(profile.calendar_sync_token);
            return new Response(
              JSON.stringify({ 
                connected: true, 
                email: tokenData.email,
                lastSync: tokenData.last_sync || null
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          } catch {
            return new Response(
              JSON.stringify({ connected: false }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
        
        return new Response(
          JSON.stringify({ connected: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in outlook-calendar-auth:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
