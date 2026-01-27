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

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  email: string;
  last_sync: string | null;
  synced_event_ids?: Record<string, string>; // bookingId -> outlookEventId
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get all boosters with Outlook calendar connected
    const { data: boosters, error } = await supabase
      .from('booster_profiles')
      .select('id, user_id, calendar_sync_token, name')
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
        const tokenData: TokenData = JSON.parse(booster.calendar_sync_token);
        
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
            tokenData.access_token = newTokens.access_token;
            tokenData.refresh_token = newTokens.refresh_token || tokenData.refresh_token;
            tokenData.expires_at = Date.now() + (newTokens.expires_in * 1000);
          } else {
            console.error(`Failed to refresh token for booster ${booster.id}`);
            results.push({ boosterId: booster.id, success: false, error: 'Token refresh failed' });
            continue;
          }
        }
        
        // ===== PART 1: Sync Outlook events TO Lovable (mark as busy) =====
        const outlookEventsResult = await syncOutlookToLovable(supabase, booster.id, accessToken);
        
        // ===== PART 2: Sync Lovable bookings TO Outlook =====
        const lovableEventsResult = await syncLovableToOutlook(supabase, booster.id, booster.name, accessToken, tokenData);
        
        // Update last sync time and synced event IDs
        tokenData.last_sync = new Date().toISOString();
        tokenData.synced_event_ids = lovableEventsResult.syncedEventIds;
        
        await supabase
          .from('booster_profiles')
          .update({ calendar_sync_token: JSON.stringify(tokenData) })
          .eq('id', booster.id);
        
        results.push({ 
          boosterId: booster.id, 
          success: true, 
          outlookToLovable: outlookEventsResult,
          lovableToOutlook: lovableEventsResult
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

// ===== Sync Outlook events to Lovable (create busy blocks) =====
async function syncOutlookToLovable(
  supabase: ReturnType<typeof createClient>,
  boosterId: string,
  accessToken: string
): Promise<{ eventsProcessed: number; blocksCreated: number }> {
  // Fetch calendar events for the next 30 days
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  const calendarResponse = await fetch(
    `${GRAPH_API_URL}/me/calendar/calendarView?startDateTime=${now.toISOString()}&endDateTime=${thirtyDaysFromNow.toISOString()}&$select=id,subject,start,end,showAs&$top=100`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );
  
  if (!calendarResponse.ok) {
    console.error(`Failed to fetch calendar for booster ${boosterId}`);
    throw new Error('Calendar fetch failed');
  }
  
  const calendarData = await calendarResponse.json();
  const events = calendarData.value || [];
  
  // Delete existing synced availability entries (not booked ones from Lovable)
  await supabase
    .from('booster_availability')
    .delete()
    .eq('booster_id', boosterId)
    .eq('status', 'synced');
  
  // Insert new availability blocks from calendar events (only private Outlook events)
  // Filter out events that we created ourselves (they have "BeautyBoosters" in subject)
  const availabilityEntries = events
    .filter((event: any) => 
      (event.showAs === 'busy' || event.showAs === 'tentative') &&
      !event.subject?.includes('BeautyBoosters:')
    )
    .map((event: any) => {
      const startDate = new Date(event.start.dateTime + 'Z');
      const endDate = new Date(event.end.dateTime + 'Z');
      
      return {
        booster_id: boosterId,
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
  
  return {
    eventsProcessed: events.length,
    blocksCreated: availabilityEntries.length
  };
}

// ===== Sync Lovable jobs to Outlook (create calendar events) =====
async function syncLovableToOutlook(
  supabase: ReturnType<typeof createClient>,
  boosterId: string,
  boosterName: string,
  accessToken: string,
  tokenData: TokenData
): Promise<{ bookingsProcessed: number; eventsCreated: number; eventsUpdated: number; syncedEventIds: Record<string, string> }> {
  
  const existingSyncedEventIds = tokenData.synced_event_ids || {};
  const newSyncedEventIds: Record<string, string> = {};
  
  // Get all jobs assigned to this booster in the next 60 days
  const now = new Date();
  const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  
  // First get job assignments for this booster
  const { data: assignments, error: assignmentsError } = await supabase
    .from('job_booster_assignments')
    .select('job_id')
    .eq('booster_id', boosterId);
  
  if (assignmentsError) {
    console.error('Error fetching job assignments:', assignmentsError);
    return { bookingsProcessed: 0, eventsCreated: 0, eventsUpdated: 0, syncedEventIds: existingSyncedEventIds };
  }
  
  const jobIds = (assignments || []).map(a => a.job_id);
  
  if (jobIds.length === 0) {
    console.log(`No job assignments found for booster ${boosterId}`);
    return { bookingsProcessed: 0, eventsCreated: 0, eventsUpdated: 0, syncedEventIds: {} };
  }
  
  // Get the actual jobs with details
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('*, job_services(*)')
    .in('id', jobIds)
    .in('status', ['assigned', 'confirmed', 'pending', 'open'])
    .gte('date_needed', now.toISOString().split('T')[0])
    .lte('date_needed', sixtyDaysFromNow.toISOString().split('T')[0]);
  
  if (jobsError) {
    console.error('Error fetching jobs:', jobsError);
    return { bookingsProcessed: 0, eventsCreated: 0, eventsUpdated: 0, syncedEventIds: existingSyncedEventIds };
  }
  
  console.log(`Found ${jobs?.length || 0} jobs to sync for booster ${boosterId}`);
  
  let eventsCreated = 0;
  let eventsUpdated = 0;
  
  for (const job of jobs || []) {
    try {
      // Build event data - handle time format (could be HH:MM or HH:MM:SS)
      const rawTime = job.time_needed || '09:00:00';
      const startTime = rawTime.slice(0, 5); // Get HH:MM part only
      const durationHours = job.duration_hours || 2;
      
      // Format for Microsoft Graph API: YYYY-MM-DDTHH:MM:SS (no Z, since we use timeZone)
      const startDateTime = `${job.date_needed}T${startTime}:00`;
      
      // Calculate end time
      const [startHour, startMin] = startTime.split(':').map(Number);
      const endHour = startHour + durationHours;
      const endTime = `${String(endHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;
      const endDateTime = `${job.date_needed}T${endTime}:00`;
      
      console.log(`Creating event for job ${job.id}: ${startDateTime} - ${endDateTime}`);
      
      // Get services for this job
      const services = job.job_services?.map((s: any) => s.service_name).join(', ') || job.service_type;
      
      // Build simple event body without special characters
      const bodyContent = [
        'Job fra BeautyBoosters',
        '',
        'Kunde: ' + (job.client_name || 'Ikke angivet'),
        'Email: ' + (job.client_email || 'Ikke angivet'),
        'Telefon: ' + (job.client_phone || 'Ikke angivet'),
        'Services: ' + services,
        'Timepris: ' + job.hourly_rate + ' DKK',
        'Varighed: ' + durationHours + ' timer'
      ].join('\n');
      
      // Sanitize location to remove special characters
      const safeLocation = (job.location || 'Kundens adresse').replace(/[^\w\s,.-]/g, '');
      
      const eventData = {
        subject: 'BeautyBoosters: ' + job.title,
        body: {
          contentType: 'text',
          content: bodyContent
        },
        start: {
          dateTime: startDateTime,
          timeZone: 'Europe/Copenhagen'
        },
        end: {
          dateTime: endDateTime,
          timeZone: 'Europe/Copenhagen'
        },
        location: {
          displayName: safeLocation
        }
      };
      
      console.log('Event data:', JSON.stringify(eventData));
      
      const existingEventId = existingSyncedEventIds[job.id];
      
      if (existingEventId) {
        // Update existing event
        const updateResponse = await fetch(
          `${GRAPH_API_URL}/me/events/${existingEventId}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData),
          }
        );
        
        if (updateResponse.ok) {
          newSyncedEventIds[job.id] = existingEventId;
          eventsUpdated++;
        } else if (updateResponse.status === 404) {
          // Event was deleted in Outlook, recreate it
          const createResult = await createOutlookEvent(accessToken, eventData);
          if (createResult.id) {
            newSyncedEventIds[job.id] = createResult.id;
            eventsCreated++;
          }
        }
      } else {
        // Create new event
        const createResult = await createOutlookEvent(accessToken, eventData);
        if (createResult.id) {
          newSyncedEventIds[job.id] = createResult.id;
          eventsCreated++;
        }
      }
    } catch (err) {
      console.error(`Error syncing job ${job.id} to Outlook:`, err);
    }
  }
  
  // Delete Outlook events for jobs no longer assigned to this booster
  const currentJobIds = new Set((jobs || []).map(j => j.id));
  for (const [jobId, eventId] of Object.entries(existingSyncedEventIds)) {
    if (!currentJobIds.has(jobId)) {
      // Job no longer active, delete the Outlook event
      try {
        await fetch(`${GRAPH_API_URL}/me/events/${eventId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        console.log(`Deleted Outlook event ${eventId} for removed job ${jobId}`);
      } catch (err) {
        console.error(`Error deleting Outlook event ${eventId}:`, err);
      }
    }
  }
  
  return {
    bookingsProcessed: jobs?.length || 0,
    eventsCreated,
    eventsUpdated,
    syncedEventIds: newSyncedEventIds
  };
}

async function createOutlookEvent(accessToken: string, eventData: any): Promise<{ id?: string }> {
  console.log('Creating Outlook event with access token length:', accessToken?.length);
  
  const createResponse = await fetch(
    `${GRAPH_API_URL}/me/events`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(eventData),
    }
  );
  
  console.log('Outlook API response status:', createResponse.status);
  
  if (createResponse.ok) {
    const createdEvent = await createResponse.json();
    console.log('Event created successfully:', createdEvent.id);
    return { id: createdEvent.id };
  } else {
    const errorText = await createResponse.text();
    console.error('Failed to create Outlook event. Status:', createResponse.status, 'Error:', errorText);
    return {};
  }
}
