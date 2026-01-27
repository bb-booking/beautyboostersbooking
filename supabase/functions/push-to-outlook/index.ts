import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MICROSOFT_CLIENT_ID = Deno.env.get('MICROSOFT_CLIENT_ID')!;
const MICROSOFT_CLIENT_SECRET = Deno.env.get('MICROSOFT_CLIENT_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const MICROSOFT_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const GRAPH_API_URL = 'https://graph.microsoft.com/v1.0';

interface JobEvent {
  job_id: string;
  title: string;
  date: string;
  start_time: string;
  duration_hours: number;
  location: string;
  description?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { booster_id, event } = await req.json() as { booster_id: string; event: JobEvent };

    if (!booster_id || !event) {
      return new Response(
        JSON.stringify({ error: 'booster_id and event are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get booster's calendar tokens
    const { data: profile, error: profileError } = await supabase
      .from('booster_profiles')
      .select('calendar_provider, calendar_sync_token')
      .eq('id', booster_id)
      .single();

    if (profileError || !profile) {
      console.error('Booster profile not found:', profileError);
      return new Response(
        JSON.stringify({ error: 'Booster profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (profile.calendar_provider !== 'outlook' || !profile.calendar_sync_token) {
      // No Outlook connected, skip silently
      return new Response(
        JSON.stringify({ success: true, message: 'No Outlook calendar connected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse stored tokens
    let tokenData;
    try {
      tokenData = JSON.parse(profile.calendar_sync_token);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid token data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is expired and refresh if needed
    let accessToken = tokenData.access_token;
    if (tokenData.expires_at && Date.now() > tokenData.expires_at - 60000) {
      console.log('Token expired, refreshing...');
      const refreshResult = await refreshAccessToken(tokenData.refresh_token);
      if (!refreshResult.success) {
        return new Response(
          JSON.stringify({ error: 'Failed to refresh token', details: refreshResult.error }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      accessToken = refreshResult.access_token;
      
      // Update stored tokens
      const updatedTokenData = {
        ...tokenData,
        access_token: refreshResult.access_token,
        refresh_token: refreshResult.refresh_token || tokenData.refresh_token,
        expires_at: Date.now() + (refreshResult.expires_in * 1000),
      };
      
      await supabase
        .from('booster_profiles')
        .update({ calendar_sync_token: JSON.stringify(updatedTokenData) })
        .eq('id', booster_id);
    }

    // Create the calendar event
    const startDateTime = `${event.date}T${event.start_time}:00`;
    const endHour = parseInt(event.start_time.split(':')[0]) + event.duration_hours;
    const endMinute = event.start_time.split(':')[1];
    const endDateTime = `${event.date}T${String(endHour).padStart(2, '0')}:${endMinute}:00`;

    const outlookEvent = {
      subject: `🎨 ${event.title}`,
      body: {
        contentType: 'HTML',
        content: event.description || `BeautyBoosters job: ${event.title}`,
      },
      start: {
        dateTime: startDateTime,
        timeZone: 'Europe/Copenhagen',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'Europe/Copenhagen',
      },
      location: {
        displayName: event.location,
      },
      categories: ['BeautyBoosters'],
    };

    console.log('Creating Outlook event:', JSON.stringify(outlookEvent));

    const createResponse = await fetch(`${GRAPH_API_URL}/me/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(outlookEvent),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Failed to create Outlook event:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to create Outlook event', details: errorText }),
        { status: createResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const createdEvent = await createResponse.json();
    console.log('Outlook event created:', createdEvent.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        outlook_event_id: createdEvent.id,
        message: 'Event created in Outlook calendar'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error pushing to Outlook:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function refreshAccessToken(refreshToken: string): Promise<{
  success: boolean;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
}> {
  try {
    const response = await fetch(MICROSOFT_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: MICROSOFT_CLIENT_ID,
        client_secret: MICROSOFT_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token refresh failed:', errorText);
      return { success: false, error: errorText };
    }

    const tokens = await response.json();
    return {
      success: true,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    return { success: false, error: String(error) };
  }
}
