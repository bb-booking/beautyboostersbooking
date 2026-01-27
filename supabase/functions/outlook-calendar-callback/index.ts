import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const MICROSOFT_CLIENT_ID = Deno.env.get('MICROSOFT_CLIENT_ID')!;
const MICROSOFT_CLIENT_SECRET = Deno.env.get('MICROSOFT_CLIENT_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const MICROSOFT_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const GRAPH_API_URL = 'https://graph.microsoft.com/v1.0';

// Get the frontend URL based on environment
const FRONTEND_URL = 'https://beautyboostersbooking.lovable.app';

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');
  
  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    return Response.redirect(
      `${FRONTEND_URL}/booster/settings?calendar_error=${encodeURIComponent(errorDescription || error)}`,
      302
    );
  }
  
  if (!code || !state) {
    return Response.redirect(
      `${FRONTEND_URL}/booster/settings?calendar_error=missing_code`,
      302
    );
  }
  
  try {
    // Exchange code for tokens
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
        generateHTML(false, 'Kunne ikke få adgangstoken fra Microsoft'),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }
    
    const tokens = await tokenResponse.json();
    
    // Get user info from Microsoft Graph
    const userInfoResponse = await fetch(`${GRAPH_API_URL}/me`, {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });
    
    if (!userInfoResponse.ok) {
      console.error('Failed to get user info');
      return new Response(
        generateHTML(false, 'Kunne ikke hente brugeroplysninger'),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }
    
    const userInfo = await userInfoResponse.json();
    const email = userInfo.mail || userInfo.userPrincipalName;
    
    // Parse state to get user ID
    let targetUserId: string;
    try {
      const stateData = JSON.parse(atob(state));
      targetUserId = stateData.userId;
    } catch {
      console.error('Failed to parse state');
      return new Response(
        generateHTML(false, 'Ugyldig tilstand'),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }
    
    // Store tokens in booster_profiles
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const tokenData = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Date.now() + (tokens.expires_in * 1000),
      email: email,
      last_sync: null,
    };
    
    // Check if booster profile exists
    const { data: existingProfile } = await supabase
      .from('booster_profiles')
      .select('id')
      .eq('user_id', targetUserId)
      .single();
    
    let updateError;
    
    if (existingProfile) {
      // Update existing profile
      const { error } = await supabase
        .from('booster_profiles')
        .update({
          calendar_provider: 'outlook',
          calendar_sync_token: JSON.stringify(tokenData),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', targetUserId);
      updateError = error;
    } else {
      // Create new profile with calendar data
      const { error } = await supabase
        .from('booster_profiles')
        .insert({
          user_id: targetUserId,
          name: userInfo.displayName || email.split('@')[0],
          email: email,
          location: 'København',
          calendar_provider: 'outlook',
          calendar_sync_token: JSON.stringify(tokenData),
        });
      updateError = error;
    }
    
    if (updateError) {
      console.error('Error storing tokens:', updateError);
      return Response.redirect(
        `${FRONTEND_URL}/booster/settings?calendar_error=save_failed`,
        302
      );
    }
    
    // Initial calendar sync
    await syncCalendarEvents(supabase, targetUserId, tokens.access_token);
    
    // Redirect back to settings with success
    return Response.redirect(
      `${FRONTEND_URL}/booster/settings?calendar_connected=outlook&email=${encodeURIComponent(email)}`,
      302
    );
    
  } catch (error) {
    console.error('Callback error:', error);
    return Response.redirect(
      `${FRONTEND_URL}/booster/settings?calendar_error=unknown`,
      302
    );
  }
});

async function syncCalendarEvents(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  accessToken: string
) {
  try {
    // Get booster profile ID
    const { data: profile } = await supabase
      .from('booster_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (!profile) return;
    
    // Fetch calendar events for the next 30 days
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const calendarResponse = await fetch(
      `${GRAPH_API_URL}/me/calendar/calendarView?startDateTime=${now.toISOString()}&endDateTime=${thirtyDaysFromNow.toISOString()}&$select=subject,start,end,showAs&$top=100`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    
    if (!calendarResponse.ok) {
      console.error('Failed to fetch calendar events');
      return;
    }
    
    const calendarData = await calendarResponse.json();
    const events = calendarData.value || [];
    
    // Delete existing synced availability entries for this booster (marked with Outlook prefix in notes)
    await supabase
      .from('booster_availability')
      .delete()
      .eq('booster_id', profile.id)
      .like('notes', 'Outlook:%');
    
    // Insert new availability blocks from calendar events
    // Use 'busy' status as it's an allowed value in the database check constraint
    const availabilityEntries = events
      .filter((event: any) => event.showAs === 'busy' || event.showAs === 'tentative')
      .map((event: any) => {
        const startDate = new Date(event.start.dateTime + 'Z');
        const endDate = new Date(event.end.dateTime + 'Z');
        
        return {
          booster_id: profile.id,
          date: startDate.toISOString().split('T')[0],
          start_time: startDate.toTimeString().slice(0, 5),
          end_time: endDate.toTimeString().slice(0, 5),
          status: 'busy',
          notes: `Outlook: ${event.subject || 'Optaget'}`,
        };
      });
    
    if (availabilityEntries.length > 0) {
      await supabase
        .from('booster_availability')
        .insert(availabilityEntries);
    }
    
    // Update last sync time
    const tokenData = JSON.parse(
      (await supabase
        .from('booster_profiles')
        .select('calendar_sync_token')
        .eq('user_id', userId)
        .single()
      ).data?.calendar_sync_token || '{}'
    );
    
    tokenData.last_sync = new Date().toISOString();
    
    await supabase
      .from('booster_profiles')
      .update({
        calendar_sync_token: JSON.stringify(tokenData),
      })
      .eq('user_id', userId);
      
  } catch (error) {
    console.error('Error syncing calendar events:', error);
  }
}

function generateHTML(success: boolean, message: string): string {
  const bgColor = success ? '#10b981' : '#ef4444';
  const icon = success ? '✓' : '✕';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${success ? 'Kalender Forbundet' : 'Fejl'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      max-width: 400px;
      width: 100%;
    }
    .icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: ${bgColor};
      color: white;
      font-size: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    h1 {
      color: #1f2937;
      font-size: 24px;
      margin-bottom: 8px;
    }
    p {
      color: #6b7280;
      font-size: 16px;
      margin-bottom: 24px;
    }
    .close-text {
      color: #9ca3af;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${success ? 'Outlook Kalender Forbundet!' : 'Der opstod en fejl'}</h1>
    <p>${message}</p>
    <p class="close-text">Du kan lukke dette vindue</p>
  </div>
  <script>
    // Notify opener window and close after delay
    if (window.opener) {
      window.opener.postMessage({ 
        type: 'outlook-calendar-connected', 
        success: ${success},
        message: '${message.replace(/'/g, "\\'")}'
      }, '*');
    }
    setTimeout(() => window.close(), 3000);
  </script>
</body>
</html>
  `;
}
