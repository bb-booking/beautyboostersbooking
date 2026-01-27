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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get all boosters with Outlook calendar connected
    const { data: boosters, error } = await supabase
      .from('booster_profiles')
      .select('id, user_id, calendar_sync_token')
      .eq('calendar_provider', 'outlook')
      .not('calendar_sync_token', 'is', null);
    
    if (error) {
      console.error('Error fetching boosters:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch boosters' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const results = [];
    
    for (const booster of boosters || []) {
      try {
        const tokenData = JSON.parse(booster.calendar_sync_token);
        
        // Check if token is expired and refresh if needed
        let accessToken = tokenData.access_token;
        
        if (tokenData.expires_at && Date.now() > tokenData.expires_at - 300000) {
          // Token expired or expiring soon, refresh it
          const refreshResponse = await fetch(MICROSOFT_TOKEN_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: MICROSOFT_CLIENT_ID,
              client_secret: MICROSOFT_CLIENT_SECRET,
              refresh_token: tokenData.refresh_token,
              grant_type: 'refresh_token',
            }),
          });
          
          if (refreshResponse.ok) {
            const newTokens = await refreshResponse.json();
            accessToken = newTokens.access_token;
            
            // Update stored tokens
            const updatedTokenData = {
              ...tokenData,
              access_token: newTokens.access_token,
              refresh_token: newTokens.refresh_token || tokenData.refresh_token,
              expires_at: Date.now() + (newTokens.expires_in * 1000),
            };
            
            await supabase
              .from('booster_profiles')
              .update({ calendar_sync_token: JSON.stringify(updatedTokenData) })
              .eq('id', booster.id);
          } else {
            console.error(`Failed to refresh token for booster ${booster.id}`);
            results.push({ boosterId: booster.id, success: false, error: 'Token refresh failed' });
            continue;
          }
        }
        
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
          console.error(`Failed to fetch calendar for booster ${booster.id}`);
          results.push({ boosterId: booster.id, success: false, error: 'Calendar fetch failed' });
          continue;
        }
        
        const calendarData = await calendarResponse.json();
        const events = calendarData.value || [];
        
        // Delete existing synced availability entries for this booster
        await supabase
          .from('booster_availability')
          .delete()
          .eq('booster_id', booster.id)
          .eq('status', 'synced');
        
        // Insert new availability blocks from calendar events
        const availabilityEntries = events
          .filter((event: any) => event.showAs === 'busy' || event.showAs === 'tentative')
          .map((event: any) => {
            const startDate = new Date(event.start.dateTime + 'Z');
            const endDate = new Date(event.end.dateTime + 'Z');
            
            return {
              booster_id: booster.id,
              date: startDate.toISOString().split('T')[0],
              start_time: startDate.toTimeString().slice(0, 5),
              end_time: endDate.toTimeString().slice(0, 5),
              status: 'synced',
              notes: `Outlook: ${event.subject || 'Optaget'}`,
            };
          });
        
        if (availabilityEntries.length > 0) {
          await supabase
            .from('booster_availability')
            .insert(availabilityEntries);
        }
        
        // Update last sync time
        const updatedTokenData = {
          ...tokenData,
          last_sync: new Date().toISOString(),
        };
        
        await supabase
          .from('booster_profiles')
          .update({ calendar_sync_token: JSON.stringify(updatedTokenData) })
          .eq('id', booster.id);
        
        results.push({ 
          boosterId: booster.id, 
          success: true, 
          eventsProcessed: events.length,
          blocksCreated: availabilityEntries.length 
        });
        
      } catch (err) {
        console.error(`Error syncing booster ${booster.id}:`, err);
        results.push({ boosterId: booster.id, success: false, error: String(err) });
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        syncedBoosters: results.filter(r => r.success).length,
        failedBoosters: results.filter(r => !r.success).length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in sync-outlook-calendar:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
